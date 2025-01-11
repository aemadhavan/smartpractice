import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { questions, categories, difficultyLevels, answers } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteProps
): Promise<NextResponse> {
  try {
    // Await the params
    const { id } = await params;
    const questionId = Number(id);
    
    if (isNaN(questionId)) {
      return NextResponse.json(
        { error: 'Invalid question ID format' },
        { status: 400 }
      );
    }

    // Fetch the question details with joins
    const [questionDetails] = await db
      .select({
        id: questions.id,
        question: questions.question,
        category: categories.name,
        difficultyLevel: difficultyLevels.name,
        marks: questions.marks,
        solutionExplanation: questions.solutionExplanation,
        timeAllocation: questions.timeAllocation,
        isActive: questions.isActive,
      })
      .from(questions)
      .leftJoin(categories, eq(questions.categoryId, categories.id))
      .leftJoin(difficultyLevels, eq(questions.difficultyLevelId, difficultyLevels.id))
      .where(eq(questions.id, questionId));

    if (!questionDetails) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Fetch answers for the question
    const questionAnswers = await db
      .select({
        id: answers.id,
        answer: answers.answer,
        isCorrect: answers.isCorrect,
        sequenceNumber: answers.sequenceNumber,
      })
      .from(answers)
      .where(eq(answers.questionId, questionId))
      .orderBy(answers.sequenceNumber);

    // Return combined question details and answers
    return NextResponse.json({
      ...questionDetails,
      answers: questionAnswers,
    });
  } catch (error) {
    console.error('Error fetching question details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question details' },
      { status: 500 }
    );
  }
}
export async function PUT(
  request: NextRequest,
  context: RouteProps
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const questionId = Number(id);

    if (isNaN(questionId)) {
      return NextResponse.json(
        { error: 'Invalid question ID' },
        { status: 400 }
      );
    }

    const data = await request.json();

    // First, get the category and difficulty level IDs
    const [categoryRecord] = await db
      .select()
      .from(categories)
      .where(eq(categories.name, data.category));

    const [difficultyRecord] = await db
      .select()
      .from(difficultyLevels)
      .where(eq(difficultyLevels.name, data.difficultyLevel));

    if (!categoryRecord || !difficultyRecord) {
      return NextResponse.json(
        { error: 'Invalid category or difficulty level' },
        { status: 400 }
      );
    }

    // Update question with category and difficulty
    const [updatedQuestion] = await db
      .update(questions)
      .set({
        question: data.question,
        categoryId: categoryRecord.id,
        difficultyLevelId: difficultyRecord.id,
        solutionExplanation: data.solutionExplanation,
        marks: data.marks,
        timeAllocation: data.timeAllocation,
        isActive: data.isActive,
      })
      .where(eq(questions.id, questionId))
      .returning();

    if (!updatedQuestion) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Update answers
    for (const answer of data.answers) {
      await db
        .update(answers)
        .set({
          answer: answer.answer,
          isCorrect: answer.isCorrect,
          sequenceNumber: answer.sequenceNumber,
        })
        .where(eq(answers.id, answer.id));
    }

    // Fetch the updated question with category and difficulty names
    const [updatedQuestionDetails] = await db
      .select({
        id: questions.id,
        question: questions.question,
        category: categories.name,
        difficultyLevel: difficultyLevels.name,
        marks: questions.marks,
        solutionExplanation: questions.solutionExplanation,
        timeAllocation: questions.timeAllocation,
        isActive: questions.isActive,
      })
      .from(questions)
      .leftJoin(categories, eq(questions.categoryId, categories.id))
      .leftJoin(difficultyLevels, eq(questions.difficultyLevelId, difficultyLevels.id))
      .where(eq(questions.id, questionId));

    return NextResponse.json({
      message: 'Question updated successfully',
      question: updatedQuestionDetails,
    });
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { error: 'Failed to update question' },
      { status: 500 }
    );
  }
}