// db/seed.ts
import { db } from './index';
import { categories, difficultyLevels, questionType, alphabetCategories } from './schema';

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

    // Seed alphabet categories
    await db.insert(alphabetCategories).values([
      { letter: 'A', description: 'Words beginning with A' },
      { letter: 'B', description: 'Words beginning with B' },
      { letter: 'C', description: 'Words beginning with C' },
      { letter: 'D', description: 'Words beginning with D' },
      { letter: 'E', description: 'Words beginning with E' },
      { letter: 'F', description: 'Words beginning with F' },
      { letter: 'G', description: 'Words beginning with G' },
      { letter: 'H', description: 'Words beginning with H' },
      { letter: 'I', description: 'Words beginning with I' },
      { letter: 'J', description: 'Words beginning with J' },
      { letter: 'K', description: 'Words beginning with K' },
      { letter: 'L', description: 'Words beginning with L' },
      { letter: 'M', description: 'Words beginning with M' },
      { letter: 'N', description: 'Words beginning with N' },
      { letter: 'O', description: 'Words beginning with O' },
      { letter: 'P', description: 'Words beginning with P' },
      { letter: 'Q', description: 'Words beginning with Q' },
      { letter: 'R', description: 'Words beginning with R' },
      { letter: 'S', description: 'Words beginning with S' },
      { letter: 'T', description: 'Words beginning with T' },
      { letter: 'U', description: 'Words beginning with U' },
      { letter: 'V', description: 'Words beginning with V' },
      { letter: 'W', description: 'Words beginning with W' },
      { letter: 'X', description: 'Words beginning with X' },
      { letter: 'Y', description: 'Words beginning with Y' },
      { letter: 'Z', description: 'Words beginning with Z' }
    ]).onConflictDoNothing();

    console.log('Seed completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Run the seed function
seed().catch(console.error);