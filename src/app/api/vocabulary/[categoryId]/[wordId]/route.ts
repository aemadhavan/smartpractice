// app/api/vocabulary/[categoryId]/[wordId]/route.ts
import { db } from "@/db";
import { vocabulary } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ categoryId: string; wordId: string }> }
) {
  try {
    const params = await context.params;
    const categoryId = parseInt(params.categoryId);
    const wordId = parseInt(params.wordId);

    if (isNaN(categoryId) || isNaN(wordId)) {
      return NextResponse.json(
        { error: "Invalid category or word ID" },
        { status: 400 }
      );
    }

    const [word] = await db
      .select()
      .from(vocabulary)
      .where(
        and(
          eq(vocabulary.id, wordId),
          eq(vocabulary.categoryId, categoryId)
        )
      );

    if (!word) {
      return NextResponse.json(
        { error: "Word not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ word });
  } catch (error) {
    console.error("Error fetching word:", error);
    return NextResponse.json(
      { error: "Failed to fetch word" },
      { status: 500 }
    );
  }
}