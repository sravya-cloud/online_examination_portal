-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "options" TEXT[] NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "questionPoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Question_questionPoolId_createdAt_idx" ON "Question"("questionPoolId", "createdAt");

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_questionPoolId_fkey"
    FOREIGN KEY ("questionPoolId") REFERENCES "QuestionPool"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
