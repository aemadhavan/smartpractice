// src/app/api/questions/practice-area/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { mathQuestions, mathTopics, mathSubtopics } from '@/db/maths-schema';
import { quantQuestions, quantTopics, quantSubtopics } from '@/db/quantitative-schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const practiceArea = searchParams.get('practiceArea');
    const topicId = searchParams.get('topicId') ? parseInt(searchParams.get('topicId')!) : null;
    const subtopicId = searchParams.get('subtopicId') ? parseInt(searchParams.get('subtopicId')!) : null;
    const dataType = searchParams.get('dataType') || 'questions'; // 'questions', 'topics', or 'subtopics'

    if (!practiceArea) {
      return NextResponse.json({ error: 'Practice area is required' }, { status: 400 });
    }

    // Fetch topics
    if (dataType === 'topics') {
      let topics = [];
      
      if (practiceArea === 'Maths') {
        topics = await db
          .select()
          .from(mathTopics)
          .where(eq(mathTopics.isActive, true));
      } else if (practiceArea === 'Quantitative') {
        topics = await db
          .select()
          .from(quantTopics)
          .where(eq(quantTopics.isActive, true));
      } else {
        return NextResponse.json({ error: 'Invalid practice area' }, { status: 400 });
      }
      
      return NextResponse.json({ topics });
    }
    
    // Fetch subtopics
    if (dataType === 'subtopics') {
      if (!topicId) {
        return NextResponse.json({ error: 'Topic ID is required for subtopics' }, { status: 400 });
      }
      
      let subtopics = [];
      
      if (practiceArea === 'Maths') {
        subtopics = await db
          .select()
          .from(mathSubtopics)
          .where(
            and(
              eq(mathSubtopics.topicId, topicId),
              eq(mathSubtopics.isActive, true)
            )
          );
      } else if (practiceArea === 'Quantitative') {
        subtopics = await db
          .select()
          .from(quantSubtopics)
          .where(
            and(
              eq(quantSubtopics.topicId, topicId),
              eq(quantSubtopics.isActive, true)
            )
          );
      } else {
        return NextResponse.json({ error: 'Invalid practice area' }, { status: 400 });
      }
      
      return NextResponse.json({ subtopics });
    }

    // Fetch questions (default)
    let questions = [];
    
    if (practiceArea === 'Maths') {
      const conditions = [eq(mathQuestions.isActive, true)];
      
      if (topicId) {
        conditions.push(eq(mathQuestions.topicId, topicId));
      }
      
      if (subtopicId) {
        conditions.push(eq(mathQuestions.subtopicId, subtopicId));
      }
      
      questions = await db
        .select()
        .from(mathQuestions)
        .where(conditions.length > 1 ? and(...conditions) : conditions[0]);
    } else if (practiceArea === 'Quantitative') {
      const conditions = [eq(quantQuestions.isActive, true)];
      
      if (topicId) {
        conditions.push(eq(quantQuestions.topicId, topicId));
      }
      
      if (subtopicId) {
        conditions.push(eq(quantQuestions.subtopicId, subtopicId));
      }
      
      questions = await db
        .select()
        .from(quantQuestions)
        .where(conditions.length > 1 ? and(...conditions) : conditions[0]);
    } else {
      return NextResponse.json({ error: 'Invalid practice area' }, { status: 400 });
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}