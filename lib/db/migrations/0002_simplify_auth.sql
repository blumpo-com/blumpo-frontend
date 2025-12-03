-- Migration: Simplify authentication flow
-- Make display_name nullable

-- Alter the column to allow NULL values
ALTER TABLE "user" 
ALTER COLUMN "display_name" DROP NOT NULL;
