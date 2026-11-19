/**
 * Calculate one point per correctly answered objective question.
 * Questions outside the exam's persisted question set are never counted.
 * Unanswered questions count toward totalMarks but not score.
 */
export function scoreObjectiveAnswers(questions, answers = {}) {
  if (!Array.isArray(questions)) {
    throw new TypeError("Questions must be an array.");
  }
  if (answers === null || typeof answers !== "object" || Array.isArray(answers)) {
    throw new TypeError("Answers must be an object keyed by question ID.");
  }

  let score = 0;
  for (const question of questions) {
    const selectedAnswer = answers[question.id];
    if (selectedAnswer === undefined || selectedAnswer === null) continue;

    const targetAnswer = question.correctAnswer !== undefined
      ? question.correctAnswer
      : Array.isArray(question.options) && typeof question.correctOption === "number"
        ? question.options[question.correctOption]
        : question.correctOption;
    if (targetAnswer === undefined || targetAnswer === null) continue;

    const normalizedAnswer = typeof selectedAnswer === "number" && Array.isArray(question.options)
      ? question.options[selectedAnswer]
      : selectedAnswer;
    if (
      normalizedAnswer !== undefined &&
      String(normalizedAnswer).trim().toLowerCase() === String(targetAnswer).trim().toLowerCase()
    ) score += 1;
  }

  return { score, totalMarks: questions.length };
}
