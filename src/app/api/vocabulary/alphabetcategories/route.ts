//src/app/api/vocabulary/alphabetcategories/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { and, eq, sql } from 'drizzle-orm';
import { 
  alphabetCategories,
  vocabulary,
  vocabularyProgress,
  categoryStatus
} from '@/db/schema';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const categoriesWithStats = await db
      .select({
        id: alphabetCategories.id,
        letter: alphabetCategories.letter,
        totalWords: sql<number>`count(distinct ${vocabulary.id})`,
        masteredWords: sql<number>`
          count(distinct case 
            when ${vocabularyProgress.masteryLevel} >= 80 
            and ${vocabularyProgress.userId} = ${sql.placeholder('userId')}
            then ${vocabulary.id} 
          end)
        `,
        inProgressWords: sql<number>`
          count(distinct case 
            when ${vocabularyProgress.masteryLevel} < 80 
            and ${vocabularyProgress.masteryLevel} > 0
            and ${vocabularyProgress.userId} = ${sql.placeholder('userId')}
            then ${vocabulary.id} 
          end)
        `,
        status: categoryStatus.status
      })
      .from(alphabetCategories)
      .leftJoin(
        vocabulary,
        and(
          eq(vocabulary.categoryId, alphabetCategories.id),
          eq(vocabulary.isActive, true)
        )
      )
      .leftJoin(
        vocabularyProgress,
        and(
          eq(vocabularyProgress.vocabularyId, vocabulary.id),
          eq(vocabularyProgress.userId, userId)
        )
      )
      .leftJoin(
        categoryStatus,
        and(
          eq(categoryStatus.categoryId, alphabetCategories.id),
          eq(categoryStatus.userId, userId)
        )
      )
      .where(eq(alphabetCategories.isActive, true))
      .groupBy(alphabetCategories.id, categoryStatus.status)
      .orderBy(alphabetCategories.letter)
      .prepare('get_categories_with_stats')
      .execute({ userId });

      const categories = categoriesWithStats.map(category => ({
        id: category.id,
        letter: category.letter,
        wordCount: Number(category.totalWords || 0),
        progress: category.totalWords > 0 
          ? Math.round((Number(category.masteredWords) / Number(category.totalWords)) * 100)
          : 0,
        masteredCount: Number(category.masteredWords || 0),
        inProgressCount: Number(category.inProgressWords || 0),
        // Add logic to determine status based on progress and other factors
        status: determineStatus(
          Number(category.masteredWords || 0), 
          Number(category.totalWords || 0)
        )
      }));

    return NextResponse.json({ 
      categories,
      metadata: {
        totalCategories: categories.length,
        totalWords: categories.reduce((sum, cat) => sum + cat.wordCount, 0),
        totalMastered: categories.reduce((sum, cat) => sum + cat.masteredCount, 0)
      }
    });

  } catch (error) {
    console.error('Error fetching alphabet categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alphabet categories' },
      { status: 500 }
    );
  }
}

function determineStatus(masteredWords: number, totalWords: number): 'success' | 'warning' | 'error' {
  if (totalWords === 0) return 'error';
  const progress = (masteredWords / totalWords) * 100;
  if (progress >= 80) return 'success';
  if (progress >= 40) return 'warning';
  return 'error';
}