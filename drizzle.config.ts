import {defineConfig} from "drizzle-kit"
import * as dotenv from "dotenv"

dotenv.config({
    path: '.env.local'
})

if(!process.env.XATA_DATABASE_URL) { 
    throw new Error("XATA_DATABASE_URL is not defined")
}

export default defineConfig({
    dialect: "postgresql",
    schema: "./src/db/schema.ts",
    out: "./src/db/migrations",
    dbCredentials: {
        url: process.env.XATA_DATABASE_URL,    
    }
});
