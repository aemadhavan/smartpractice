// app/api/vocabulary/track-attempt/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/db';
import { vocabularyAttempts } from '@/db/schema';
import { getAuth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { vocabularyId, stepType, isSuccessful, response, timeSpent } = body;

        // Validate required fields
        if (!vocabularyId || !stepType) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Insert attempt
        const [attempt] = await db.insert(vocabularyAttempts).values({
            userId,
            vocabularyId,
            stepType,
            isSuccessful,
            response,
            timeSpent,
        }).returning();

        return NextResponse.json(attempt);
    } catch (error) {
        console.error('Error tracking attempt:', error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}