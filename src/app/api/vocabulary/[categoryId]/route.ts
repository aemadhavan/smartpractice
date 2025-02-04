// src/app/api/vocabulary/[categoryId]/route.ts
import { db } from "@/db";
import { vocabulary, vocabularyProgress } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ categoryId: string }> };

export async function GET(
  request: NextRequest,
  context: Params
): Promise<NextResponse> {
  try {
    const params = await context.params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const categoryId = parseInt(params.categoryId);

    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: "Invalid category ID" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get words with their progress
    const words = await db
      .select({
        id: vocabulary.id,
        word: vocabulary.word,
        definition: vocabulary.definition,
        synonyms: vocabulary.synonyms,
        antonyms: vocabulary.antonyms,
        partOfSpeech: vocabulary.partOfSpeech,
        sentence: vocabulary.sentence,
        masteryLevel: sql<number>`coalesce(${vocabularyProgress.masteryLevel}, 0)`,
        stepCompletion: vocabularyProgress.stepCompletion
      })
      .from(vocabulary)
      .leftJoin(
        vocabularyProgress,
        and(
          eq(vocabularyProgress.vocabularyId, vocabulary.id),
          eq(vocabularyProgress.userId, userId)
        )
      )
      .where(eq(vocabulary.categoryId, categoryId))
      .orderBy(vocabulary.word);

    // Calculate statistics
    const stats = {
      totalWords: words.length,
      masteredCount: words.filter(w => (w.masteryLevel || 0) >= 80).length,
      learningCount: words.filter(w => (w.masteryLevel || 0) > 0 && (w.masteryLevel || 0) < 80).length,
      toStartCount: words.filter(w => !w.masteryLevel || w.masteryLevel === 0).length
    };

    // Transform words data
    const transformedWords = words.map(word => ({
      ...word,
      difficultyLevel: word.word.length <= 5 ? 'Easy' 
                    : word.word.length <= 8 ? 'Medium' 
                    : 'Hard',
      status: word.masteryLevel >= 80 ? 'Mastered' 
           : word.masteryLevel > 0 ? 'Learning' 
           : 'To Start',
      progress: word.masteryLevel || 0
    }));

    return NextResponse.json({
      words: transformedWords,
      stats
    });

  } catch (error) {
    console.error("Error fetching vocabularies:", error);
    return NextResponse.json(
      { error: "Failed to fetch vocabularies" },
      { status: 500 }
    );
  }
}