// src/app/api/maths/adaptive-recommendations/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { auth } from '@clerk/nextjs/server';
//import { eq, and, isNull } from 'drizzle-orm';
//import { learningGaps } from '@/db/adaptive-schema';
//import { mathSubtopics } from '@/db/maths-schema';
import { getAdaptiveLearningRecommendations } from '@/lib/adaptive-learning';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const topicId = url.searchParams.get('topicId');
    
    if (!topicId) {
      return NextResponse.json(
        { success: false, error: 'Topic ID is required' },
        { status: 400 }
      );
    }

    // Get learning gaps for this user and topic
    const activeGaps = await db.query.learningGaps.findMany({
      where: (gaps, { eq, and, isNull }) => 
        and(
          eq(gaps.userId, userId),
          isNull(gaps.resolvedAt)
        ),
      with: {
        subtopic: true
      }
    });

    // Filter gaps to only those related to the specified topic
    const topicGaps = await Promise.all(
      activeGaps.filter(async gap => {
        const subtopic = await db.query.mathSubtopics.findFirst({
          where: (subtopics, { eq }) => eq(subtopics.id, gap.subtopicId)
        });
        return subtopic?.topicId === parseInt(topicId);
      })
    );

    // Get adaptive learning recommendations
    const recommendations = await getAdaptiveLearningRecommendations(
      userId,
      parseInt(topicId)
    );

    return NextResponse.json({
      success: true,
      learningGaps: topicGaps,
      recommendedSubtopics: recommendations.recommendedSubtopics,
      hasAdaptiveLearningEnabled: recommendations.hasAdaptiveLearningEnabled
    });
  } catch (error) {
    console.error('Error in adaptive recommendations:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}