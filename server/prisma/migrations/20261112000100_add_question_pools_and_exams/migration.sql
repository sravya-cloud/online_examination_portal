-- CreateTable
CREATE TABLE "QuestionPool" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "questionCount" INTEGER NOT NULL,
    "questionPoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuestionPool_name_key" ON "QuestionPool"("name");

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_questionPoolId_fkey"
    FOREIGN KEY ("questionPoolId") REFERENCES "QuestionPool"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
