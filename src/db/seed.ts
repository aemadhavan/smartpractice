// db/seed.ts
import { db } from './index';
import { categories, difficultyLevels, questionType } from './schema';

async function seed() {
  try {
    // Seed categories
    await db.insert(categories).values([
      {
        name: 'quantitative',
        description: 'Questions related to mathematical and numerical problems'
      },
      {
        name: 'verbal',
        description: 'Questions testing language and vocabulary skills'
      },
      {
        name: 'reading',
        description: 'Questions testing reading comprehension'
      }
    ]).onConflictDoNothing();

    // Seed difficulty levels
    await db.insert(difficultyLevels).values([
      {
        name: 'easy',
        description: 'Basic level questions suitable for beginners'
      },
      {
        name: 'medium',
        description: 'Intermediate level questions requiring good understanding'
      },
      {
        name: 'hard',
        description: 'Advanced level questions requiring deep knowledge'
      }
    ]).onConflictDoNothing();

    // Seed question types
    await db.insert(questionType).values([
      {
        name: 'multiple_choice',
        description: 'Questions with multiple options where one is correct'
      }
    ]).onConflictDoNothing();

    console.log('Seed completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Run the seed function
seed().catch(console.error);