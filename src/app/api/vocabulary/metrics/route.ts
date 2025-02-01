// src/app/api/vocabulary/metrics/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { and, eq, sql } from 'drizzle-orm';
import { 
  vocabularyAttempts, 
  vocabularyProgress, 
  userStreaks,
  vocabulary
} from '@/db/schema';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get user streak
    const streakResult = await db
      .select()
      .from(userStreaks)
      .where(eq(userStreaks.userId, userId))
      .limit(1);
    
    const streak = streakResult[0];

    // Calculate success rate from attempts
    const attemptsStats = await db
      .select({
        total: sql<number>`count(*)`,
        successful: sql<number>`sum(case when ${vocabularyAttempts.isSuccessful} then 1 else 0 end)`
      })
      .from(vocabularyAttempts)
      .where(eq(vocabularyAttempts.userId, userId));

    const successRate = attemptsStats[0].successful / attemptsStats[0].total * 100 || 0;

    // Calculate average attempts per word directly without subquery
    const averageAttempts = await db
      .select({
        average: sql<number>`cast(count(*)::float / count(distinct ${vocabularyAttempts.vocabularyId}) as numeric(10,2))`
      })
      .from(vocabularyAttempts)
      .where(eq(vocabularyAttempts.userId, userId));

    // Get total unique words practiced
    const totalWords = await db
      .select({
        count: sql<number>`count(distinct ${vocabularyProgress.vocabularyId})`
      })
      .from(vocabularyProgress)
      .where(eq(vocabularyProgress.userId, userId));

    // Calculate performance by category
    const performanceByType = await db
      .select({
        stepType: vocabularyAttempts.stepType,
        successRate: sql<number>`cast(
          sum(case when ${vocabularyAttempts.isSuccessful} then 1 else 0 end) * 100.0 / 
          nullif(count(*), 0) as numeric(10,2)
        )`
      })
      .from(vocabularyAttempts)
      .where(eq(vocabularyAttempts.userId, userId))
      .groupBy(vocabularyAttempts.stepType);

    // Get recent activity
    const recentActivity = await db
      .select({
        vocabularyId: vocabularyAttempts.vocabularyId,
        stepType: vocabularyAttempts.stepType,
        isSuccessful: vocabularyAttempts.isSuccessful,
        createdAt: vocabularyAttempts.createdAt,
        word: vocabulary.word
      })
      .from(vocabularyAttempts)
      .leftJoin(vocabulary, eq(vocabularyAttempts.vocabularyId, vocabulary.id))
      .where(eq(vocabularyAttempts.userId, userId))
      .orderBy(sql`${vocabularyAttempts.createdAt} desc`)
      .limit(5);

    return NextResponse.json({
      metrics: {
        successRate: Math.round(successRate * 10) / 10,
        currentStreak: streak?.currentStreak || 0,
        averageAttempts: Number(averageAttempts[0]?.average || 0),
        totalWords: totalWords[0].count || 0,
        performanceByType: performanceByType.map(p => ({
          category: p.stepType,
          value: Number(p.successRate) || 0
        })),
        recentActivity
      }
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch metrics',
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
  }
}