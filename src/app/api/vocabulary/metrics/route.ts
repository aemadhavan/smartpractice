//src/app/api/vocabulary/metrics/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { and, eq, sql } from 'drizzle-orm';
import { 
  vocabularyProgress,
  vocabulary,
  userStreaks,
  vocabularyAttempts
} from '@/db/schema';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get total words count and mastered words
    const [wordsStats] = await db
      .select({
        totalWords: sql<number>`count(distinct ${vocabulary.id})`,
        masteredWords: sql<number>`
          count(distinct case 
            when ${vocabularyProgress.masteryLevel} >= 80 
            and ${vocabularyProgress.userId} = ${sql.placeholder('userId')}
            then ${vocabulary.id} 
          end)
        `
      })
      .from(vocabulary)
      .leftJoin(
        vocabularyProgress,
        and(
          eq(vocabularyProgress.vocabularyId, vocabulary.id),
          eq(vocabularyProgress.userId, userId)
        )
      )
      .where(eq(vocabulary.isActive, true))
      .prepare('get_words_stats')
      .execute({ userId });

    // Get today's progress (unique words practiced today)
    const [todayProgress] = await db
      .select({
        count: sql<number>`count(distinct ${vocabularyAttempts.vocabularyId})`
      })
      .from(vocabularyAttempts)
      .where(
        and(
          eq(vocabularyAttempts.userId, userId),
          sql`date(${vocabularyAttempts.createdAt}) = current_date`
        )
      );

    // Get current streak
    const [userStreak] = await db
      .select({
        currentStreak: sql<number>`coalesce(${userStreaks.currentStreak}, 0)`,
        lastActivityAt: userStreaks.lastActivityAt
      })
      .from(userStreaks)
      .where(eq(userStreaks.userId, userId));

    // Check if streak needs to be reset (no activity in last 24 hours)
    const lastActivity = userStreak?.lastActivityAt ? new Date(userStreak.lastActivityAt) : null;
    const now = new Date();
    const hoursSinceLastActivity = lastActivity 
      ? (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60)
      : 25; // Default to expired if no activity

    const currentStreak = hoursSinceLastActivity <= 24 ? userStreak?.currentStreak || 0 : 0;

    const DAILY_GOAL = 15;

    return NextResponse.json({
      totalWords: Number(wordsStats?.totalWords || 0),
      masteredWords: Number(wordsStats?.masteredWords || 0),
      dailyGoal: DAILY_GOAL,
      dailyProgress: Number(todayProgress?.count || 0),
      currentStreak,
      lastActivityAt: userStreak?.lastActivityAt
    });

  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}