// src/scripts/fix-all-test-sessions.ts
import { db } from '@/db/index';
import { quantTestAttempts, quantQuestionAttempts } from '@/db/quantitative-schema';
import { eq, and, count } from 'drizzle-orm';

/**
 * This script fixes all test sessions in the database by recounting
 * the actual number of questions and correct answers for each session.
 * 
 * Usage:
 * npx ts-node -r tsconfig-paths/register src/scripts/fix-all-test-sessions.ts
 */
async function fixAllTestSessions() {
  try {
    console.log('Starting comprehensive fix for all test sessions...');
    
    // 1. Fix null isCorrect values first
    console.log('\nStep 1: Fixing NULL isCorrect values...');
    
    // For PostgreSQL:
    const updateNullResult = await db.execute(
      `UPDATE "quantQuestionAttempts" SET "is_correct" = false WHERE "is_correct" IS NULL`
    );
    
    console.log(`Updated ${updateNullResult.rowCount || 'unknown number of'} NULL isCorrect values to FALSE`);
    
    // 2. Get all test sessions
    const testSessions = await db.query.quantTestAttempts.findMany();
    console.log(`\nStep 2: Found ${testSessions.length} test sessions to process`);
    
    // 3. Process each test session
    let fixedCount = 0;
    let alreadyConsistentCount = 0;
    
    for (const session of testSessions) {
      // Count total questions for this session
      const totalQuestionsResult = await db.select({
        count: count()
      })
      .from(quantQuestionAttempts)
      .where(
        eq(quantQuestionAttempts.testAttemptId, session.id)
      );
      
      const totalQuestions = totalQuestionsResult[0]?.count || 0;
      
      // Count correct answers for this session
      const correctAnswersResult = await db.select({
        count: count()
      })
      .from(quantQuestionAttempts)
      .where(
        and(
          eq(quantQuestionAttempts.testAttemptId, session.id),
          eq(quantQuestionAttempts.isCorrect, true)
        )
      );
      
      const correctAnswers = correctAnswersResult[0]?.count || 0;
      
      // Calculate score
      const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
      
      // Check if update is needed
      const needsUpdate = 
        session.totalQuestions !== totalQuestions || 
        session.correctAnswers !== correctAnswers ||
        session.score !== score;
      
      if (needsUpdate) {
        // Update the session
        await db.update(quantTestAttempts)
          .set({
            totalQuestions: totalQuestions,
            correctAnswers: correctAnswers,
            score: score
          })
          .where(eq(quantTestAttempts.id, session.id));
        
        console.log(`Fixed session ${session.id}:`);
        console.log(`  Before: total=${session.totalQuestions}, correct=${session.correctAnswers}, score=${session.score}`);
        console.log(`  After:  total=${totalQuestions}, correct=${correctAnswers}, score=${score}`);
        
        fixedCount++;
      } else {
        alreadyConsistentCount++;
      }
    }
    
    console.log(`\nProcessing complete!`);
    console.log(`- ${fixedCount} sessions required fixes and were updated`);
    console.log(`- ${alreadyConsistentCount} sessions were already consistent`);
    console.log(`- ${testSessions.length} total sessions processed`);
    
    // 4. Generate SQL to make isCorrect NOT NULL
    console.log('\nStep 3: To complete the fix, run this SQL to make isCorrect NOT NULL:');
    console.log(`
ALTER TABLE "quantQuestionAttempts" 
  ALTER COLUMN "is_correct" SET NOT NULL,
  ALTER COLUMN "is_correct" SET DEFAULT false;
    `);
    
  } catch (error) {
    console.error('Error fixing test sessions:', error);
  }
}

// Run the fix
fixAllTestSessions().then(() => {
  console.log('\nFix completed successfully');
  process.exit(0);
}).catch(err => {
  console.error('Fix failed:', err);
  process.exit(1);
});