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
    if (answers[question.id] !== undefined && answers[question.id] === question.correctAnswer) {
      score += 1;
    }
  }

  return { score, totalMarks: questions.length };
}
