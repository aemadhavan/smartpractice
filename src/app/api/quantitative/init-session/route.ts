//File: src/app/api/quantitative/init-session/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import { quantTestAttempts } from '@/db/quantitative-schema';

/**
 * API endpoint to initialize a new test session
 * This creates a test session immediately when a quiz is started, 
 * rather than waiting for the first question attempt
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, subtopicId } = body;
    
    console.log('INITIALIZING TEST SESSION:', {
      userId,
      subtopicId,
      timestamp: new Date().toISOString()
    });

    // Validate required fields
    const missingFields = [];
    if (!userId) missingFields.push('userId');
    if (!subtopicId) missingFields.push('subtopicId');
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return NextResponse.json(
        { error: "Missing required fields", missingFields },
        { status: 400 }
      );
    }

    // Create a new test session
    const newTestAttempt = await db.insert(quantTestAttempts).values({
      userId,
      subtopicId,
      startTime: new Date(),
      status: 'in_progress',
      totalQuestions: 0,
      correctAnswers: 0
    }).returning({ id: quantTestAttempts.id });
    
    const testAttemptId = newTestAttempt[0].id;
    
    console.log('TEST SESSION INITIALIZED:', {
      testAttemptId,
      userId,
      subtopicId
    });

    return NextResponse.json({ 
      success: true,
      message: "Test session initialized successfully",
      testAttemptId
    });
    
  } catch (error) {
    console.error('CRITICAL ERROR - Initializing test session:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';
    
    return NextResponse.json(
      { error: "Failed to initialize test session", details: errorMessage },
      { status: 500 }
    );
  }
}