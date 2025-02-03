//src/app/api/vocabulary/track-attempt/route.ts
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, vocabularyId, stepType, isSuccessful, response, timeSpent } = body;

    console.log('Received attempt:', { userId, vocabularyId, stepType, isSuccessful }); // Debug log

    if (!userId || !vocabularyId || !stepType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
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

      console.log('Recorded attempt:', attempt); // Debug log

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

      console.log('Current progress:', progress); // Debug log

      // Update progress if attempt was successful
      if (isSuccessful) {
        // Ensure we have valid current step completion
        const currentStepCompletion = (progress.stepCompletion as StepCompletion) || defaultStepCompletion;
        
        // Create updated step completion, preserving existing progress
        const updatedStepCompletion: StepCompletion = {
          ...defaultStepCompletion, // Start with defaults
          ...currentStepCompletion, // Override with current progress
          [stepType]: true // Add new success
        };

        console.log('Updated step completion:', updatedStepCompletion); // Debug log

        // Calculate new mastery level based on completed steps
        const completedSteps = Object.values(updatedStepCompletion).filter(Boolean).length;
        const masteryLevel = Math.round((completedSteps / 4) * 100);

        console.log('New mastery level:', masteryLevel); // Debug log

        // Update progress record
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

        console.log('Updated progress:', progress); // Debug log

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

    console.log('Final result:', result); // Debug log
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error tracking attempt:', error);
    return NextResponse.json(
      { error: 'Failed to track attempt' },
      { status: 500 }
    );
  }
}