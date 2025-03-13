// File: src/app/api/maths/init-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db/index';
import { mathTestAttempts } from '@/db/maths-schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, subtopicId } = body;

    const db = await getDb();

    console.log('INITIALIZING MATH TEST SESSION:', {
      userId,
      subtopicId,
      timestamp: new Date().toISOString(),
    });

    const missingFields = [];
    if (!userId) missingFields.push('userId');
    if (!subtopicId) missingFields.push('subtopicId');

    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return NextResponse.json(
        { error: 'Missing required fields', missingFields },
        { status: 400 }
      );
    }

    const newTestAttempt = await db
      .insert(mathTestAttempts)
      .values({
        userId,
        subtopicId,
        startTime: new Date(),
        status: 'in_progress',
        totalQuestions: 0,
        correctAnswers: 0,
      })
      .returning({ id: mathTestAttempts.id });

    const testAttemptId = newTestAttempt[0].id;

    console.log('MATH TEST SESSION INITIALIZED:', {
      testAttemptId,
      userId,
      subtopicId,
    });

    return NextResponse.json({
      success: true,
      message: 'Test session initialized successfully',
      testAttemptId,
    });
  } catch (error) {
    console.error('CRITICAL ERROR - Initializing math test session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to initialize test session', details: errorMessage },
      { status: 500 }
    );
  }
}