import { NextResponse } from 'next/server';
import { db } from '@/db';
import { and, eq, sql } from 'drizzle-orm';
import { 
  vocabularyAttempts, 
  vocabularyProgress,
  vocabulary,
  userStreaks 
} from '@/db/schema';

interface StepCompletion {
  definition: boolean;
  usage: boolean;
  synonym: boolean;
  antonym: boolean;
}

// Define the expected request body type
interface TrackAttemptRequest {
  userId: string;
  vocabularyId: number;
  stepType: 'definition' | 'usage' | 'synonym' | 'antonym';
  isSuccessful: boolean;
  response?: string;
  timeSpent?: number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as TrackAttemptRequest;
    const { userId, vocabularyId, stepType, isSuccessful, response, timeSpent } = body;

    console.log('Received attempt:', { userId, vocabularyId, stepType, isSuccessful });

    // Enhanced validation
    if (!userId || userId.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid user ID - must be a non-empty string' },
        { status: 400 }
      );
    }

    if (!vocabularyId || vocabularyId <= 0) {
      return NextResponse.json(
        { error: 'Invalid vocabulary ID - must be a positive number' },
        { status: 400 }
      );
    }

    if (!['definition', 'usage', 'synonym', 'antonym'].includes(stepType)) {
      return NextResponse.json(
        { error: 'Invalid step type - must be one of: definition, usage, synonym, antonym' },
        { status: 400 }
      );
    }

    if (typeof isSuccessful !== 'boolean') {
      return NextResponse.json(
        { error: 'isSuccessful must be a boolean value' },
        { status: 400 }
      );
    }

    // Verify the vocabulary item exists
    const [vocabularyExists] = await db
      .select({ id: vocabulary.id })
      .from(vocabulary)
      .where(eq(vocabulary.id, vocabularyId));

    if (!vocabularyExists) {
      return NextResponse.json(
        { error: 'Vocabulary item not found' },
        { status: 404 }
      );
    }

    // Begin transaction
    const result = await db.transaction(async (tx) => {
      // Record the attempt
      const [attempt] = await tx
        .insert(vocabularyAttempts)
        .values({
          userId,
          vocabularyId,
          stepType,
          isSuccessful,
          response,
          timeSpent,
        })
        .returning();

      console.log('Recorded attempt:', attempt);

      // Get or create progress record
      let [progress] = await tx
        .select()
        .from(vocabularyProgress)
        .where(
          and(
            eq(vocabularyProgress.userId, userId),
            eq(vocabularyProgress.vocabularyId, vocabularyId)
          )
        );

      const defaultStepCompletion: StepCompletion = {
        definition: false,
        usage: false,
        synonym: false,
        antonym: false
      };

      if (!progress) {
        [progress] = await tx
          .insert(vocabularyProgress)
          .values({
            userId,
            vocabularyId,
            masteryLevel: 0,
            stepCompletion: defaultStepCompletion
          })
          .returning();
      }

      // Update progress if attempt was successful
      if (isSuccessful) {
        const currentStepCompletion = (progress.stepCompletion as StepCompletion) || defaultStepCompletion;
        
        const updatedStepCompletion: StepCompletion = {
          ...defaultStepCompletion,
          ...currentStepCompletion,
          [stepType]: true
        };

        const completedSteps = Object.values(updatedStepCompletion).filter(Boolean).length;
        const masteryLevel = Math.round((completedSteps / 4) * 100);

        [progress] = await tx
          .update(vocabularyProgress)
          .set({
            masteryLevel,
            stepCompletion: updatedStepCompletion,
            lastAttemptAt: sql`CURRENT_TIMESTAMP`
          })
          .where(
            and(
              eq(vocabularyProgress.userId, userId),
              eq(vocabularyProgress.vocabularyId, vocabularyId)
            )
          )
          .returning();

        // Update user streak
        await tx
          .insert(userStreaks)
          .values({
            userId,
            currentStreak: 1,
            lastActivityAt: new Date()
          })
          .onConflictDoUpdate({
            target: userStreaks.userId,
            set: {
              currentStreak: sql`
                CASE
                  WHEN date(${userStreaks.lastActivityAt}) = CURRENT_DATE - INTERVAL '1 day'
                  THEN ${userStreaks.currentStreak} + 1
                  WHEN date(${userStreaks.lastActivityAt}) < CURRENT_DATE - INTERVAL '1 day'
                  THEN 1
                  ELSE ${userStreaks.currentStreak}
                END
              `,
              lastActivityAt: new Date(),
              longestStreak: sql`
                GREATEST(
                  ${userStreaks.longestStreak},
                  CASE
                    WHEN date(${userStreaks.lastActivityAt}) = CURRENT_DATE - INTERVAL '1 day'
                    THEN ${userStreaks.currentStreak} + 1
                    WHEN date(${userStreaks.lastActivityAt}) < CURRENT_DATE - INTERVAL '1 day'
                    THEN 1
                    ELSE ${userStreaks.currentStreak}
                  END
                )
              `
            }
          });
      }

      // Get daily progress
      const [todayProgress] = await tx
        .select({
          dailyCount: sql<number>`
            count(distinct case 
              when date(${vocabularyAttempts.createdAt}) = CURRENT_DATE 
              then ${vocabularyAttempts.vocabularyId} 
            end)
          `
        })
        .from(vocabularyAttempts)
        .where(eq(vocabularyAttempts.userId, userId));

      return {
        attempt,
        progress,
        dailyProgress: todayProgress.dailyCount
      };
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error tracking attempt:', error);
    return NextResponse.json(
      { error: 'Failed to track attempt' },
      { status: 500 }
    );
  }
}