-- CreateEnum
CREATE TYPE "QuestionDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- Add the new field as nullable, backfill existing FR-05 records, then require it.
ALTER TABLE "Question" ADD COLUMN "difficulty" "QuestionDifficulty";
UPDATE "Question" SET "difficulty" = 'MEDIUM' WHERE "difficulty" IS NULL;
ALTER TABLE "Question" ALTER COLUMN "difficulty" SET NOT NULL;
