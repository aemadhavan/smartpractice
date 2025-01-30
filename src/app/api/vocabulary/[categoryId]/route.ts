// src/app/api/vocabulary/[categoryId]/route.ts
import { db } from "@/db";
import { vocabulary } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: { categoryId: string } };

export async function GET(
  request: NextRequest,
  { params }: Params
): Promise<NextResponse> {
  try {
    // Wait for params to be resolved
    const resolvedParams = await Promise.resolve(params);
    const categoryId = parseInt(resolvedParams.categoryId);

    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: "Invalid category ID" },
        { status: 400 }
      );
    }

    const words = await db.query.vocabulary.findMany({
      where: (vocabulary, { eq }) => eq(vocabulary.categoryId, categoryId),
      orderBy: (vocabulary, { asc }) => [asc(vocabulary.word)]
    });

    return NextResponse.json({ words });
  } catch (error) {
    console.error("Error fetching vocabularies:", error);
    return NextResponse.json(
      { error: "Failed to fetch vocabularies" },
      { status: 500 }
    );
  }
}