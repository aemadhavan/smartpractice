// src/app/api/vocabulary/alphabetcategories/route.ts

import { db } from "@/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const categories = await db.query.alphabetCategories.findMany({
      orderBy: (categories, { asc }) => [asc(categories.letter)],
      where: (categories, { eq }) => eq(categories.isActive, true),
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching alphabet categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch alphabet categories" },
      { status: 500 }
    );
  }
}