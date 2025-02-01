// app/api/vocabulary/update-mastery/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/db';
import { vocabularyProgress } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAuth } from '@clerk/nextjs/server';

interface StepCompletion {
    definition: boolean;
    usage: boolean;
    synonym: boolean;
    antonym: boolean;
}

type StepType = keyof StepCompletion;

interface UpdateMasteryRequest {
    vocabularyId: number;
    stepType: StepType;
    isSuccessful: boolean;
}

async function handleRequest(req: NextRequest) {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json() as UpdateMasteryRequest;
        const { vocabularyId, stepType, isSuccessful } = body;

        // Validate required fields
        if (!vocabularyId || !stepType) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Validate step type
        const validStepTypes: StepType[] = ['definition', 'usage', 'synonym', 'antonym'];
        if (!validStepTypes.includes(stepType)) {
            return new NextResponse("Invalid step type", { status: 400 });
        }

        // Get or create progress record
        let [progress] = await db.select()
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
            [progress] = await db.insert(vocabularyProgress)
                .values({
                    userId,
                    vocabularyId,
                    masteryLevel: 0,
                    stepCompletion: defaultStepCompletion
                })
                .returning();
        }

        // Ensure stepCompletion has all required properties
        const currentStepCompletion = progress.stepCompletion as StepCompletion;
        
        // Update step completion and mastery level
        const stepCompletion: StepCompletion = {
            ...defaultStepCompletion,
            ...currentStepCompletion,
            [stepType]: isSuccessful
        };

        // Calculate new mastery level (0-4 based on completed steps)
        const completedSteps = Object.values(stepCompletion).filter(Boolean).length;
        const masteryLevel = Math.min(completedSteps, 4);

        // Update progress
        const [updatedProgress] = await db
            .update(vocabularyProgress)
            .set({
                masteryLevel,
                stepCompletion,
                lastAttemptAt: new Date(),
            })
            .where(
                and(
                    eq(vocabularyProgress.userId, userId),
                    eq(vocabularyProgress.vocabularyId, vocabularyId)
                )
            )
            .returning();

        return NextResponse.json(updatedProgress);
    } catch (error) {
        console.error('Error updating mastery:', error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// Support both PUT and POST methods
export const PUT = handleRequest;
export const POST = handleRequest;