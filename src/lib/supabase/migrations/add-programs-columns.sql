-- First, check if columns exist and modify them to allow NULL if needed
DO $$
BEGIN
    -- Handle price column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'programs' AND column_name = 'price') THEN
        ALTER TABLE programs ADD COLUMN price DECIMAL(10, 2) DEFAULT 0;
    ELSE
        -- Make price nullable if it exists and is NOT NULL
        ALTER TABLE programs ALTER COLUMN price DROP NOT NULL;
        ALTER TABLE programs ALTER COLUMN price SET DEFAULT 0;
    END IF;

    -- Handle currency column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'programs' AND column_name = 'currency') THEN
        ALTER TABLE programs ADD COLUMN currency VARCHAR(3) DEFAULT 'USD';
    END IF;

    -- Handle duration_weeks column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'programs' AND column_name = 'duration_weeks') THEN
        ALTER TABLE programs ADD COLUMN duration_weeks INTEGER;
    END IF;

    -- Handle max_students column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'programs' AND column_name = 'max_students') THEN
        ALTER TABLE programs ADD COLUMN max_students INTEGER;
    END IF;

    -- Handle docusign_template_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'programs' AND column_name = 'docusign_template_id') THEN
        ALTER TABLE programs ADD COLUMN docusign_template_id VARCHAR(255);
    END IF;

    -- Handle payment_plan column (constraint accepts: 'one_time' or 'installments')
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'programs' AND column_name = 'payment_plan') THEN
        -- Make payment_plan nullable if it exists and is NOT NULL
        ALTER TABLE programs ALTER COLUMN payment_plan DROP NOT NULL;
        -- Use 'one_time' as default (matching the constraint)
        ALTER TABLE programs ALTER COLUMN payment_plan SET DEFAULT 'one_time';
    ELSE
        ALTER TABLE programs ADD COLUMN payment_plan VARCHAR(50) DEFAULT 'one_time';
    END IF;

    -- Handle crm_tag column
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'programs' AND column_name = 'crm_tag') THEN
        -- Make crm_tag nullable if it exists and is NOT NULL
        ALTER TABLE programs ALTER COLUMN crm_tag DROP NOT NULL;
        ALTER TABLE programs ALTER COLUMN crm_tag SET DEFAULT 'general';
    ELSE
        ALTER TABLE programs ADD COLUMN crm_tag VARCHAR(100) DEFAULT 'general';
    END IF;
END $$;