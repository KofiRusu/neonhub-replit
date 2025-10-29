-- Enable citext extension for case-insensitive text
CREATE EXTENSION IF NOT EXISTS citext;

-- Normalize existing keyword terms to lowercase
UPDATE keywords SET term = LOWER(term);

-- Remove any duplicate keywords (keep the oldest one)
WITH duplicates AS (
  SELECT id, term, ROW_NUMBER() OVER (PARTITION BY LOWER(term) ORDER BY "createdAt" ASC) as rn
  FROM keywords
)
DELETE FROM keywords
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Change term column to citext type
ALTER TABLE keywords ALTER COLUMN term TYPE citext USING term::citext;

-- Add unique constraint on term (case-insensitive)
ALTER TABLE keywords ADD CONSTRAINT "ux_keyword_term_ci" UNIQUE (term);

-- Drop old index on term and create new index on personaId
DROP INDEX IF EXISTS "keywords_term_idx";
CREATE INDEX IF NOT EXISTS "ix_keyword_persona" ON keywords("personaId");

