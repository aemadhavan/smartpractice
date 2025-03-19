// src/app/api/maths/generate-feedback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';
import { db } from '@/db';
import { mathQuestionAttempts, mathTestAttempts } from '@/db/maths-schema';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

// Define an interface for the structure we expect
interface QuestionAttemptWithQuestion {
  id: number;
  testAttemptId: number;
  questionId: number;
  userAnswer: string | null;
  isCorrect: boolean;
  timeSpent: number | null;
  question: {
    id: number;
    question: string;
    correctAnswer: string;
    explanation: string | null;
  };
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { testAttemptId } = await req.json();
    
    // Fetch test attempt
    const testAttempt = await db.query.mathTestAttempts.findFirst({
      where: eq(mathTestAttempts.id, testAttemptId),
      with: {
        subtopic: true
      }
    });

    if (!testAttempt) {
      return NextResponse.json({ error: 'Test attempt not found' }, { status: 404 });
    }

    // Fetch question attempts separately and use type assertion
    const queryResult = await db.query.mathQuestionAttempts.findMany({
      where: eq(mathQuestionAttempts.testAttemptId, testAttemptId),
      with: {
        question: true
      }
    });
    
    // Type assertion to handle the TypeScript issue
    const questionAttempts = queryResult as unknown as QuestionAttemptWithQuestion[];

    if (questionAttempts.length === 0) {
      return NextResponse.json({ error: 'No question attempts found' }, { status: 404 });
    }

    // Format questions and answers for LLM input
    const questionsAndAnswers = questionAttempts.map((attempt, index) => {
      return `Question ${index + 1}: ${attempt.question.question}
Your Answer: ${attempt.userAnswer || "Not answered"}
Correct Answer: ${attempt.question.correctAnswer}
${attempt.question.explanation ? `Explanation: ${attempt.question.explanation}` : ''}`;
    }).join('\n\n');

    // Generate feedback using Groq
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Australian Year 8 Mathematics Teacher"
        },
        {
          role: "user",
          content: `Evaluate this student on this topic and give feedback like area to improve and percentage.\n "${questionsAndAnswers}"`
        }
      ],
      model: "qwen-2.5-32b",
      temperature: 0.6,
      max_completion_tokens: 4096,
      top_p: 0.95
    });

    const feedback = chatCompletion.choices[0].message.content;
    
    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Error generating feedback:', error);
    return NextResponse.json({ error: 'Failed to generate feedback' }, { status: 500 });
  }
}