/**
 * Selects exactly count questions randomly from available pool questions.
 * Satisfies FR-09 (Random selection of questions from pool - VAL-F05).
 * 
 * @param {Array} questions - Array of candidate questions in pool
 * @param {number} count - Exactly N questions to select
 * @param {Function} [randomFn] - Optional injected RNG for deterministic testing
 * @returns {Array} Exactly count randomly selected questions
 */
export function selectRandomQuestions(questions, count, randomFn = Math.random) {
  if (!Array.isArray(questions)) {
    throw new TypeError("Questions must be an array.");
  }
  if (!Number.isInteger(count) || count < 1) {
    throw new RangeError("Question count must be a positive integer.");
  }
  if (questions.length < count) {
    const error = new Error(`Insufficient questions in pool: requested ${count}, but pool only contains ${questions.length}.`);
    error.code = "INSUFFICIENT_POOL_QUESTIONS";
    throw error;
  }

  // Fisher-Yates shuffle on a shallow copy to sample without replacement
  const pool = [...questions];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, count);
}
