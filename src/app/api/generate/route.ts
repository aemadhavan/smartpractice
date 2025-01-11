// app/api/generate/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { questions, categories, difficultyLevels, questionType, answers } from '@/db/schema';
import { eq, ilike } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';

interface ParsedQuestion {
  question: string;
  answers: string[];
  correctAnswerIndex: number;
  difficulty: string;
  solution: string;
  marks?: number;
  timeAllocation?: number;
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, prompt } = body;

    const structuredPrompt = `
      Generate 25 multiple choice questions about ${prompt}. Each question should test different concepts and difficulty levels. Ensure a good mix of Easy (40%), Medium (40%), and Hard (20%) questions.

      Requirements:
      1. Question text should be clear and concise
      2. Each question must have exactly 4 answer options
      3. Specify the correct answer index (0-3)
      4. Use "Easy", "Medium", or "Hard" for difficulty
      5. Provide a solution explanation in a SINGLE LINE - no line breaks or multiple paragraphs
      6. Distribute time allocation appropriately:
         - Easy questions: 60 seconds
         - Medium questions: 90 seconds
         - Hard questions: 120 seconds
      7. Distribute marks appropriately:
         - Easy questions: 1 mark
         - Medium questions: 2 marks
         - Hard questions: 3 marks

      Respond with ONLY a JSON array using this EXACT format:
      [
        {
          "question": "What is...",
          "answers": ["A", "B", "C", "D"],
          "correctAnswerIndex": 2,
          "difficulty": "Medium",
          "solution": "The answer is C because... [single line explanation]",
          "marks": 2,
          "timeAllocation": 90
        }
      ]

      IMPORTANT:
      - Keep solution explanations in a single line without any line breaks or special characters
      - Ensure questions are unique and non-repetitive
      - Make answer options plausible but clearly distinguishable
    `;

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4000, // Increased to accommodate 25 questions
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: structuredPrompt,
        },
      ],
    });

    const contentBlock = message.content[0];
    if (contentBlock.type !== 'text') {
      throw new Error('Unexpected response format from Claude');
    }

    // Clean up the response before parsing
    const cleanedContent = contentBlock.text
      .trim()
      .replace(/\n+/g, ' ')  // Replace multiple newlines with spaces
      .replace(/\s+/g, ' ')  // Normalize spaces
      .replace(/\\n/g, ' '); // Remove any escaped newlines

    console.log('Cleaned content:', cleanedContent);

    const parsedQuestions = parseGeneratedContent(cleanedContent);

    // Validate we got the expected number of questions
    if (parsedQuestions.length !== 25) {
      console.warn(`Expected 25 questions but received ${parsedQuestions.length}`);
    }

    for (const questionData of parsedQuestions) {
      // Case-insensitive search for category
      const [categoryRecord] = await db
        .select()
        .from(categories)
        .where(ilike(categories.name, category));

      // Case-insensitive search for difficulty level
      const [difficultyRecord] = await db
        .select()
        .from(difficultyLevels)
        .where(ilike(difficultyLevels.name, questionData.difficulty));

      const [questionTypeRecord] = await db
        .select()
        .from(questionType)
        .where(ilike(questionType.name, 'multiple_choice'));

      if (!categoryRecord) {
        throw new Error(`Category "${category}" not found in database`);
      }
      if (!difficultyRecord) {
        throw new Error(`Difficulty level "${questionData.difficulty}" not found in database`);
      }
      if (!questionTypeRecord) {
        throw new Error('Question type "multiple_choice" not found in database');
      }

      // Set default marks and time allocation based on difficulty if not provided
      const marks = questionData.marks || 
        (questionData.difficulty === 'Easy' ? 1 : 
         questionData.difficulty === 'Medium' ? 2 : 3);
      
      const timeAllocation = questionData.timeAllocation || 
        (questionData.difficulty === 'Easy' ? 60 : 
         questionData.difficulty === 'Medium' ? 90 : 120);

      const [insertedQuestion] = await db
        .insert(questions)
        .values({
          categoryId: categoryRecord.id,
          questionTypeId: questionTypeRecord.id,
          difficultyLevelId: difficultyRecord.id,
          question: questionData.question,
          solutionExplanation: questionData.solution,
          marks: marks,
          timeAllocation: timeAllocation,
          createdBy: 1,
          isActive: true
        })
        .returning();

      for (const [index, answerText] of questionData.answers.entries()) {
        await db.insert(answers).values({
          questionId: insertedQuestion.id,
          answer: answerText,
          isCorrect: index === questionData.correctAnswerIndex,
          sequenceNumber: index + 1,
          isActive: true
        });
      }
    }

    return NextResponse.json({ 
      success: true,
      questionsGenerated: parsedQuestions.length
    });
  } catch (error) {
    console.error('Error in generate route:', error);
    return NextResponse.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    );
  }
}

function parseGeneratedContent(content: string): ParsedQuestion[] {
  try {
    // Try to find a JSON array in the content and clean it
    const jsonMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!jsonMatch) {
      console.error('No JSON array found in content:', content);
      throw new Error('No JSON array found in the response');
    }

    let questions: ParsedQuestion[];
    const jsonContent = jsonMatch[0].replace(/\n/g, ' ').replace(/\s+/g, ' ');
    
    try {
      questions = JSON.parse(jsonContent) as ParsedQuestion[];
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Attempted to parse:', jsonContent);
      throw new Error('Failed to parse JSON response');
    }

    return questions.map((q, index) => {
      if (!q.question || !Array.isArray(q.answers) || !q.difficulty || !q.solution) {
        console.error(`Question ${index} missing required fields:`, q);
        throw new Error(`Question ${index} is missing required fields`);
      }

      if (q.answers.length !== 4) {
        console.error(`Question ${index} has wrong number of answers:`, q.answers);
        throw new Error(`Question ${index} must have exactly 4 answers`);
      }

      if (typeof q.correctAnswerIndex !== 'number' || 
          q.correctAnswerIndex < 0 || 
          q.correctAnswerIndex > 3) {
        console.error(`Question ${index} has invalid correctAnswerIndex:`, q.correctAnswerIndex);
        throw new Error(`Question ${index} has invalid correct answer index`);
      }

      if (!['Easy', 'Medium', 'Hard'].includes(q.difficulty)) {
        console.error(`Question ${index} has invalid difficulty:`, q.difficulty);
        throw new Error(`Question ${index} has invalid difficulty level`);
      }

      return {
        question: q.question.trim(),
        answers: q.answers.map(a => a.trim()),
        correctAnswerIndex: q.correctAnswerIndex,
        difficulty: q.difficulty,
        solution: q.solution.trim(),
        marks: q.marks || 1,
        timeAllocation: q.timeAllocation || 60
      };
    });
  } catch (error) {
    console.error('Error parsing generated content:', error);
    throw new Error('Failed to parse generated questions');
  }
}