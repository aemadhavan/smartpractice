// src/app/api/quantitative/generate-feedback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';
import { db } from '@/db';
import { quantQuestionAttempts, quantQuestions, quantTestAttempts } from '@/db/quantitative-schema';
import { eq, inArray } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

interface FeedbackData {
  overallPerformance: string;
  strengths: string;
  areasForImprovement: string;
  actionableAdvice: string;
  overall: string;
  rawFeedback?: string;
}

export async function POST(req: NextRequest) {
  // Authenticate the user
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Parse the request to get the test attempt ID and feedback type
    const { testAttemptId, feedbackType = 'standard' } = await req.json();
    console.log(`Generating quantitative feedback for test attempt ID: ${testAttemptId}`);
    
    // Verify the test attempt exists
    const testAttempts = await db
      .select()
      .from(quantTestAttempts)
      .where(eq(quantTestAttempts.id, testAttemptId));

    console.log(`Found ${testAttempts.length} quantitative test attempts`);
    
    if (testAttempts.length === 0) {
      console.log(`Quantitative test attempt ${testAttemptId} not found in database`);
      return NextResponse.json({ error: 'Test attempt not found' }, { status: 404 });
    }

    // Fetch question attempts using direct query
    const questionAttempts = await db
      .select()
      .from(quantQuestionAttempts)
      .where(eq(quantQuestionAttempts.testAttemptId, testAttemptId));

    console.log(`Found ${questionAttempts.length} question attempts for quantitative test ${testAttemptId}`);
    
    if (questionAttempts.length === 0) {
      console.log(`No question attempts found for quantitative test ${testAttemptId}`);
      return NextResponse.json({ error: 'No question attempts found' }, { status: 404 });
    }

    // Calculate performance metrics
    const correctCount = questionAttempts.filter(a => a.isCorrect).length;
    const incorrectCount = questionAttempts.length - correctCount;
    const percentageScore = Math.round((correctCount / questionAttempts.length) * 100);

    // Get the question IDs from the attempts
    const questionIds = questionAttempts.map(attempt => attempt.questionId);
    console.log(`Quantitative question IDs to fetch: ${questionIds.join(', ')}`);

    // Fetch the corresponding questions
    const questions = await db
      .select({
        id: quantQuestions.id,
        question: quantQuestions.question,
        correctAnswer: quantQuestions.correctAnswer,
        explanation: quantQuestions.explanation
      })
      .from(quantQuestions)
      .where(inArray(quantQuestions.id, questionIds));

    console.log(`Found ${questions.length} quantitative questions`);
    
    if (questions.length === 0) {
      console.log(`No quantitative questions found for IDs: ${questionIds.join(', ')}`);
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

    // Create performance summary
    const promptSummary = `
Performance Summary:
- Total Questions: ${questionAttempts.length}
- Correct Answers: ${correctCount} (${percentageScore}%)
- Incorrect Answers: ${incorrectCount}

Detailed Question Analysis:
`;

    // Format questions and answers for the AI model with clear marking of correctness
    const questionsAndAnswers = combinedData.map((attempt, index) => {
      // Safely access the explanation property with explicit null check
      const explanation = attempt.question.explanation;
      const explanationText = explanation !== null && explanation !== undefined
        ? `Explanation: ${explanation}` 
        : '';
      
      const correctnessMarker = attempt.isCorrect 
        ? "✓ CORRECT" 
        : "✗ INCORRECT";
        
      return `Question ${index + 1}: ${attempt.question.question}
Status: ${correctnessMarker}
Your Answer: ${attempt.userAnswer || "Not answered"}
Correct Answer: ${attempt.question.correctAnswer}
${explanationText}`;
    }).join('\n\n');

    // Combine summary with detailed questions
    const fullPrompt = promptSummary + questionsAndAnswers;

    console.log('Prepared quantitative questions and answers for AI model');

    // Select the appropriate system prompt based on feedback type
    let systemPrompt = "";
    if (feedbackType === 'growth') {
      systemPrompt = "You are an experienced Australian Year 8 Mathematics teacher providing structured feedback for quantitative reasoning with a focus on growth mindset and positive reinforcement. Your response should be ONLY in JSON format with the following fields: overallPerformance (including percentage score but emphasizing effort over grades), strengths (highlighting specific concepts mastered), areasForImprovement (framed as growth opportunities), actionableAdvice (concrete next steps with resources), and overall (encouraging conclusion that emphasizes progress). Keep each section concise and focused on motivating the student while being informative for parents.";
    } else {
      systemPrompt = "You are an experienced Australian Year 8 Mathematics teacher providing structured feedback for quantitative reasoning. Your response should be ONLY in JSON format with the following fields: overallPerformance (including percentage score), strengths, areasForImprovement, actionableAdvice, and overall (brief conclusion). Keep each section concise and focused on helping parents understand their child's performance. Ensure you accurately identify all incorrect questions in your feedback.";
    }

    // Check for API key
    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY environment variable is not set');
      throw new Error('API key configuration error');
    }

    // Generate feedback using Groq API
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });

    console.log('Sending request to Groq API for quantitative feedback...');
    
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Please evaluate this student's performance on the following quantitative reasoning questions and provide structured feedback in JSON format only:\n\n${fullPrompt}`
        }
      ],
      model: "qwen-2.5-7b", // Use a smaller model for faster processing
      temperature: 0.6,
      max_tokens: 2048,
      top_p: 0.95
    });
      
    // Parse the JSON response
    let feedbackData: FeedbackData;
    try {
      // Safely access the response content
      const responseContent = chatCompletion.choices[0]?.message?.content;
      
      if (!responseContent) {
        throw new Error('Empty response from AI model');
      }

      // Try to parse the model's response as JSON
      const parsedResponse = JSON.parse(responseContent);
      
      // Validate the score representation in the feedback
      const percentageMatch = parsedResponse.overallPerformance.match(/(\d+)%/);
      const reportedPercentage = percentageMatch ? parseInt(percentageMatch[1]) : null;
      
      // If there's a significant discrepancy, adjust the performance text
      if (reportedPercentage && Math.abs(reportedPercentage - percentageScore) > 5) {
        parsedResponse.overallPerformance = 
          `${percentageScore}% (${correctCount} correct out of ${questionAttempts.length}). ${parsedResponse.overallPerformance}`;
      }
      
      // Initialize with validated data
      feedbackData = {
        overallPerformance: parsedResponse.overallPerformance || `${percentageScore}% (${correctCount} correct out of ${questionAttempts.length})`,
        strengths: parsedResponse.strengths || "Not provided",
        areasForImprovement: parsedResponse.areasForImprovement || "Not provided",
        actionableAdvice: parsedResponse.actionableAdvice || "Not provided",
        overall: parsedResponse.overall || "Not provided",
      };
      
    } catch (e) {
      // If parsing fails, create a structured format from the raw text
      console.error('Failed to parse AI response as JSON:', e);
      const rawFeedback = chatCompletion.choices[0]?.message?.content || '';
      
      feedbackData = {
        overallPerformance: `${percentageScore}% (${correctCount} correct out of ${questionAttempts.length})`,
        strengths: "Strengths information could not be structured automatically.",
        areasForImprovement: "Areas for improvement could not be structured automatically.",
        actionableAdvice: "Advice could not be structured automatically.",
        overall: "Please review the detailed feedback for complete information.",
        rawFeedback: rawFeedback // This is now guaranteed to be a string
      };
    }

    return NextResponse.json({ feedback: feedbackData });
  } catch (error) {
    console.error('Error generating quantitative feedback:', error);
    return NextResponse.json({ 
      error: 'Failed to generate feedback',
      details: error instanceof Error ? error.message : 'Unknown error',
      feedback: {
        overallPerformance: "We encountered an issue generating detailed feedback for your quantitative reasoning test.",
        strengths: "Your test answers have been recorded successfully.",
        areasForImprovement: "Our system was unable to analyze specific improvement areas at this time.",
        actionableAdvice: "Please review the questions you answered incorrectly and try generating feedback again later.",
        overall: "We apologize for the inconvenience. Our team is working to ensure feedback is available for all test sessions."
      }
    }, { status: 500 });
  }
}