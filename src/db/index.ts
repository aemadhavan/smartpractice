import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { 
    categories,
    difficultyLevels,
    questionType,
    questions,
    alphabetCategories,
    vocabulary
} from "@/db/schema";

const pool = new Pool({ connectionString: process.env.XATA_DATABASE_URL, max: 10 });
export const db = drizzle(pool,{schema: {categories,difficultyLevels,
                                        questionType,questions,
                                        alphabetCategories,
                                        vocabulary}});