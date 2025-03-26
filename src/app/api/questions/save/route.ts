// src/app/api/questions/save/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { mathQuestions } from '@/db/maths-schema';
import { quantQuestions } from '@/db/quantitative-schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { practiceArea, isReviewed, ...questionData } = body;
    
    // Remove fields that shouldn't be directly saved to the database
    const { id, ...dataToInsert } = questionData;
    
    if (!practiceArea) {
      return NextResponse.json({ error: 'Practice area is required' }, { status: 400 });
    }
    
    let savedQuestion;
    
    // Save to the appropriate table based on practice area
    if (practiceArea === 'Maths') {
      if (id) {
        // Update existing question
        await db
          .update(mathQuestions)
          .set({
            topicId: dataToInsert.topicId,
            subtopicId: dataToInsert.subtopicId,
            question: dataToInsert.question,
            options: dataToInsert.options,
            correctAnswer: dataToInsert.correctAnswer,
            formula: dataToInsert.formula || '',
            explanation: dataToInsert.explanation,
            timeAllocation: dataToInsert.timeAllocation,
            isActive: dataToInsert.isActive,
            updatedAt: new Date()
          })
          .where(eq(mathQuestions.id, id));
        
        // Fetch the updated question
        const updatedQuestions = await db
          .select()
          .from(mathQuestions)
          .where(eq(mathQuestions.id, id));
          
        savedQuestion = updatedQuestions[0];
      } else {
        // Insert new question
        const result = await db
          .insert(mathQuestions)
          .values({
            topicId: dataToInsert.topicId,
            subtopicId: dataToInsert.subtopicId,
            questionTypeId: 1, // Default to multiple choice (adjust as needed)
            difficultyLevelId: 1, // Default to easy (adjust as needed)
            question: dataToInsert.question,
            options: dataToInsert.options,
            correctAnswer: dataToInsert.correctAnswer,
            formula: dataToInsert.formula || '',
            explanation: dataToInsert.explanation,
            timeAllocation: dataToInsert.timeAllocation,
            createdBy: dataToInsert.createdBy || 1,
            isActive: dataToInsert.isActive,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();
        
        savedQuestion = result[0];
      }
    } else if (practiceArea === 'Quantitative') {
      if (id) {
        // Update existing question
        await db
          .update(quantQuestions)
          .set({
            topicId: dataToInsert.topicId,
            subtopicId: dataToInsert.subtopicId,
            question: dataToInsert.question,
            options: dataToInsert.options,
            correctAnswer: dataToInsert.correctAnswer,
            formula: dataToInsert.formula || '',
            explanation: dataToInsert.explanation,
            timeAllocation: dataToInsert.timeAllocation,
            isActive: dataToInsert.isActive,
            updatedAt: new Date()
          })
          .where(eq(quantQuestions.id, id));
        
        // Fetch the updated question
        const updatedQuestions = await db
          .select()
          .from(quantQuestions)
          .where(eq(quantQuestions.id, id));
          
        savedQuestion = updatedQuestions[0];
      } else {
        // Insert new question
        const result = await db
          .insert(quantQuestions)
          .values({
            topicId: dataToInsert.topicId,
            subtopicId: dataToInsert.subtopicId,
            questionTypeId: 1, // Default to multiple choice (adjust as needed)
            difficultyLevelId: 1, // Default to easy (adjust as needed)
            question: dataToInsert.question,
            options: dataToInsert.options,
            correctAnswer: dataToInsert.correctAnswer,
            formula: dataToInsert.formula || '',
            explanation: dataToInsert.explanation,
            timeAllocation: dataToInsert.timeAllocation,
            createdBy: dataToInsert.createdBy || 1,
            isActive: dataToInsert.isActive,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();
        
        savedQuestion = result[0];
      }
    } else {
      return NextResponse.json({ error: 'Invalid practice area' }, { status: 400 });
    }

    // Log the 'isReviewed' status if it's important for tracking
    if (isReviewed !== undefined) {
      console.log(`Question ${id} review status: ${isReviewed}`);
    }

    return NextResponse.json({ 
      message: id ? 'Question updated successfully' : 'Question created successfully',
      question: { ...savedQuestion, practiceArea }
    });
  } catch (error) {
    console.error('Error saving question:', error);
    return NextResponse.json({ 
      error: 'Failed to save question', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}