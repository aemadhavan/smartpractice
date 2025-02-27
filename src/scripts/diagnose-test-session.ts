// src/scripts/diagnose-test-session.ts
import { db } from '@/db/index';
import { quantTestAttempts, quantQuestionAttempts, quantQuestions } from '@/db/quantitative-schema';
import { eq, and } from 'drizzle-orm';

/**
 * This script provides a comprehensive diagnosis of a test session
 * with detailed debugging information.
 * 
 * Usage:
 * npx ts-node -r tsconfig-paths/register src/scripts/diagnose-test-session.ts <test_session_id>
 */
async function diagnoseTestSession(testSessionId: number) {
  try {
    console.log(`=== DETAILED DIAGNOSIS FOR TEST SESSION ID: ${testSessionId} ===\n`);
    
    // 1. Get the test session details
    const testSession = await db.query.quantTestAttempts.findFirst({
      where: eq(quantTestAttempts.id, testSessionId)
    });
    
    if (!testSession) {
      console.error(`❌ Test session with ID ${testSessionId} not found`);
      return;
    }
    
    console.log('📝 Test Session Details:');
    console.log(JSON.stringify(testSession, null, 2));
    
    // 2. Get all question attempts for this session
    const questionAttempts = await db.query.quantQuestionAttempts.findMany({
      where: eq(quantQuestionAttempts.testAttemptId, testSessionId)
    });
    
    console.log(`\n🧮 Found ${questionAttempts.length} question attempts for this session`);
    
    // 3. Analyze question attempts
    const questionIds = questionAttempts.map(a => a.questionId);
    const uniqueQuestionIds = [...new Set(questionIds)];
    
    console.log(`\n📊 Question Attempts Analysis:`);
    console.log(`Total attempts: ${questionAttempts.length}`);
    console.log(`Unique questions: ${uniqueQuestionIds.length}`);
    
    if (questionIds.length !== uniqueQuestionIds.length) {
      console.log(`⚠️ WARNING: There are duplicate question attempts (${questionIds.length - uniqueQuestionIds.length})`);
      
      // Find which questions have multiple attempts
      const questionCounts = questionIds.reduce((acc, id) => {
        acc[id] = (acc[id] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
      
      const duplicates = Object.entries(questionCounts)
        .filter(([_, count]) => count > 1)
        .map(([id, count]) => ({ id: parseInt(id), count }));
      
      console.log('Duplicate questions:', duplicates);
    }
    
    // 4. Fetch question details
    const questions = await db.query.quantQuestions.findMany({
      where: eq(quantQuestions.id, questionIds[0]) // At least get details for one question
    });
    
    const questionTypeExample = questions.length > 0 ? questions[0].questionTypeId : 'unknown';
    console.log(`\n📋 Question Type Sample: ${questionTypeExample}`);
    
    // 5. Show detailed isCorrect value inspection
    console.log('\n🔍 isCorrect Value Inspection:');
    
    const isCorrectValues = questionAttempts.map(a => a.isCorrect);
    const isCorrectValuesMap = isCorrectValues.reduce(
      (acc, val) => {
        const key = val === null ? 'null' : val === true ? 'true' : 'false';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      { 'true': 0, 'false': 0, 'null': 0 } as Record<string, number>
    );
    
    console.log('isCorrect value counts:', isCorrectValuesMap);
    console.log(`true values: ${isCorrectValuesMap.true}`);
    console.log(`false values: ${isCorrectValuesMap.false}`);
    console.log(`null values: ${isCorrectValuesMap.null}`);
    
    // 6. Details about each question attempt
    console.log('\n📄 Question Attempts Details:');
    questionAttempts.forEach((attempt, index) => {
      console.log(`\n[Attempt ${index + 1}]`);
      console.log(`ID: ${attempt.id}`);
      console.log(`Question ID: ${attempt.questionId}`);
      console.log(`Is Correct: ${attempt.isCorrect} (Type: ${typeof attempt.isCorrect}, Strict Equality with true: ${attempt.isCorrect === true})`);
      console.log(`User Answer: ${attempt.userAnswer}`);
      console.log(`Time Spent: ${attempt.timeSpent} seconds`);
    });
    
    // 7. Count correct answers with different methods
    console.log('\n🔎 Counting Methods Comparison:');
    
    // Method 1: Simple filter
    const correctCount1 = questionAttempts.filter(a => a.isCorrect).length;
    console.log(`Method 1 (a.isCorrect): ${correctCount1}`);
    
    // Method 2: Strict equality
    const correctCount2 = questionAttempts.filter(a => a.isCorrect === true).length;
    console.log(`Method 2 (a.isCorrect === true): ${correctCount2}`);
    
    // Method 3: Boolean constructor
    const correctCount3 = questionAttempts.filter(a => Boolean(a.isCorrect)).length;
    console.log(`Method 3 (Boolean(a.isCorrect)): ${correctCount3}`);
    
    // 8. Consistency check
    console.log('\n✅ Consistency Check:');
    console.log(`Test Session Total Questions: ${testSession.totalQuestions}`);
    console.log(`Actual Question Attempts: ${questionAttempts.length}`);
    console.log(`Test Session Correct Answers: ${testSession.correctAnswers}`);
    console.log(`Actual Correct Answers (method 1): ${correctCount1}`);
    console.log(`Actual Correct Answers (method 2): ${correctCount2}`);
    
    const discrepancy = {
      totalQuestions: testSession.totalQuestions !== questionAttempts.length,
      correctAnswers: testSession.correctAnswers !== correctCount2
    };
    
    if (discrepancy.totalQuestions) {
      console.log(`❌ INCONSISTENCY: Total questions count mismatch`);
      console.log(`   Database: ${testSession.totalQuestions}, Actual: ${questionAttempts.length}`);
    } else {
      console.log('✓ Total questions consistent');
    }
    
    if (discrepancy.correctAnswers) {
      console.log(`❌ INCONSISTENCY: Correct answers count mismatch`);
      console.log(`   Database: ${testSession.correctAnswers}, Actual: ${correctCount2}`);
    } else {
      console.log('✓ Correct answers consistent');
    }
    
    // 9. Recommended fix
    if (discrepancy.totalQuestions || discrepancy.correctAnswers) {
      console.log('\n🔧 Recommended Fix:');
      console.log(`UPDATE "quantTestAttempts" SET`);
      console.log(`  "total_questions" = ${questionAttempts.length},`);
      console.log(`  "correct_answers" = ${correctCount2},`);
      console.log(`  "score" = ${questionAttempts.length > 0 ? Math.round((correctCount2 / questionAttempts.length) * 100) : 0}`);
      console.log(`WHERE "id" = ${testSessionId};`);
    } else {
      console.log('\n✅ No fixes needed! Session data is consistent.');
    }
    
    // 10. Suggestions for permanent fix
    console.log('\n💡 Suggestions for Permanent Fix:');
    console.log('1. Make sure isCorrect is NOT NULL in your database schema');
    console.log('2. Always use strict equality (===) when comparing boolean values');
    console.log('3. Consider running a database-wide fix for all existing records');
    
  } catch (error) {
    console.error('Error diagnosing test session:', error);
  }
}

// Get the test session ID from command line argument
const testSessionId = parseInt(process.argv[2]);

if (isNaN(testSessionId)) {
  console.error('Please provide a valid test session ID');
  process.exit(1);
}

// Run the diagnosis
diagnoseTestSession(testSessionId).then(() => {
  console.log('\nDiagnosis completed');
  process.exit(0);
}).catch(err => {
  console.error('Diagnosis failed:', err);
  process.exit(1);
});