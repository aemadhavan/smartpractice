DO $$ BEGIN
    -- Create drizzle_migrations table if it doesn't exist
    CREATE TABLE IF NOT EXISTS "drizzle_migrations" (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at timestamptz DEFAULT now()
    );
    
    -- Record existing tables in migration history
    INSERT INTO drizzle_migrations (hash) 
    SELECT 'existing_schema_' || now()
    WHERE NOT EXISTS (SELECT 1 FROM drizzle_migrations);

END $$;

-- Add columns if they don't exist
DO $$ BEGIN
    -- Add sentence column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='vocabulary' AND column_name='sentence') THEN
        ALTER TABLE vocabulary ADD COLUMN sentence text;
    END IF;

    -- Add synonyms column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='vocabulary' AND column_name='synonyms') THEN
        ALTER TABLE vocabulary ADD COLUMN synonyms text;
    END IF;

    -- Add antonyms column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='vocabulary' AND column_name='antonyms') THEN
        ALTER TABLE vocabulary ADD COLUMN antonyms text;
    END IF;
END $$;