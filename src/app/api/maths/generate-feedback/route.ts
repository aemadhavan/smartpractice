// src/app/api/maths/generate-feedback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';
import { db } from '@/db';
import { mathQuestionAttempts, mathQuestions, mathTestAttempts } from '@/db/maths-schema';
import { eq, inArray } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  // Authenticate the user
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Parse the request to get the test attempt ID
    const { testAttemptId } = await req.json();
    console.log(`Generating feedback for test attempt ID: ${testAttemptId}`);
    
    // Verify the test attempt exists
    const testAttempts = await db
      .select()
      .from(mathTestAttempts)
      .where(eq(mathTestAttempts.id, testAttemptId));

    console.log(`Found ${testAttempts.length} test attempts`);
    
    if (testAttempts.length === 0) {
      console.log(`Test attempt ${testAttemptId} not found in database`);
      return NextResponse.json({ error: 'Test attempt not found' }, { status: 404 });
    }

    // Fetch question attempts using direct query
    const questionAttempts = await db
      .select()
      .from(mathQuestionAttempts)
      .where(eq(mathQuestionAttempts.testAttemptId, testAttemptId));

    console.log(`Found ${questionAttempts.length} question attempts for test ${testAttemptId}`);
    
    if (questionAttempts.length === 0) {
      console.log(`No question attempts found for test ${testAttemptId}`);
      return NextResponse.json({ error: 'No question attempts found' }, { status: 404 });
    }

    // Get the question IDs from the attempts
    const questionIds = questionAttempts.map(attempt => attempt.questionId);
    console.log(`Question IDs to fetch: ${questionIds.join(', ')}`);

    // Fetch the corresponding questions
    const questions = await db
      .select({
        id: mathQuestions.id,
        question: mathQuestions.question,
        correctAnswer: mathQuestions.correctAnswer,
        explanation: mathQuestions.explanation
      })
      .from(mathQuestions)
      .where(inArray(mathQuestions.id, questionIds));

    console.log(`Found ${questions.length} questions`);
    
    if (questions.length === 0) {
      console.log(`No questions found for IDs: ${questionIds.join(', ')}`);
      return NextResponse.json({ error: 'Questions not found' }, { status: 404 });
    }

    // Combine the data manually
    const combinedData = questionAttempts.map(attempt => {
      const question = questions.find(q => q.id === attempt.questionId);
      return {
        id: attempt.id,
        testAttemptId: attempt.testAttemptId,
        questionId: attempt.questionId,
        userAnswer: attempt.userAnswer,
        isCorrect: attempt.isCorrect,
        timeSpent: attempt.timeSpent,
        question: question || {
          id: 0,
          question: "Question not found",
          correctAnswer: "Unknown",
          explanation: null
        }
      };
    });

    // Format questions and answers for the AI model
    const questionsAndAnswers = combinedData.map((attempt, index) => {
      return `Question ${index + 1}: ${attempt.question.question}
Your Answer: ${attempt.userAnswer || "Not answered"}
Correct Answer: ${attempt.question.correctAnswer}
${attempt.question.explanation ? `Explanation: ${attempt.question.explanation}` : ''}`;
    }).join('\n\n');

    console.log('Prepared questions and answers for AI model');

    // Generate feedback using Groq API
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });

    console.log('Sending request to Groq API...');
    
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an experienced Australian Year 8 Mathematics teacher providing feedback to a student. Be encouraging but specific about strengths and areas to improve. Include percentage scores where relevant and provide actionable advice."
        },
        {
          role: "user",
          content: `Please evaluate this student's performance on the following math questions and provide detailed feedback:\n\n${questionsAndAnswers}`
        }
      ],
      model: "qwen-2.5-32b",
      temperature: 0.6,
      max_tokens: 4096,
      top_p: 0.95
    });

    console.log('Received response from Groq API');

    // Extract and return the feedback
    const feedback = chatCompletion.choices[0].message.content;
    
    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Error generating feedback:', error);
    return NextResponse.json({ 
      error: 'Failed to generate feedback',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}