// app/api/questions/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { questions, categories, difficultyLevels} from '@/db/schema';
import { and, eq, ilike } from 'drizzle-orm';
import { SQL } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');

    // Build the where conditions array
    const whereConditions: SQL[] = [eq(questions.isActive, true)];

    // Only add category filter if it's provided and not 'all'
    if (category && category.toLowerCase() !== 'all') {
      whereConditions.push(ilike(categories.name, category));
    }
    
    // Only add difficulty filter if it's provided and not 'all'
    if (difficulty && difficulty.toLowerCase() !== 'all') {
      whereConditions.push(ilike(difficultyLevels.name, difficulty));
    }

    // Execute the query with all conditions
    const questionResults = await db
      .select({
        id: questions.id,
        question: questions.question,
        category: categories.name,
        difficultyLevel: difficultyLevels.name,
        marks: questions.marks,
      })
      .from(questions)
      .leftJoin(categories, eq(questions.categoryId, categories.id))
      .leftJoin(difficultyLevels, eq(questions.difficultyLevelId, difficultyLevels.id))
      .where(and(...whereConditions))
      .orderBy(questions.createdAt);

    return NextResponse.json(questionResults);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}