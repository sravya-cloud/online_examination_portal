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

function createSeededRandom(seed) {
  let state = 2166136261;
  for (const character of String(seed)) {
    state = Math.imul(state ^ character.charCodeAt(0), 16777619);
  }

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Shuffles a fixed exam question set into a stable order for one attempt.
 * The input array and its question objects are not modified.
 *
 * @param {Array} questions - The question set already selected for the exam
 * @param {string|number} attemptKey - Stable key for this student's exam attempt
 * @returns {Array} A shuffled copy of the same question set
 */
export function shuffleQuestionsForAttempt(questions, attemptKey) {
  if (!Array.isArray(questions)) {
    throw new TypeError("Questions must be an array.");
  }
  if (attemptKey === undefined || attemptKey === null || String(attemptKey).length === 0) {
    throw new TypeError("An attempt key is required to shuffle questions.");
  }

  const shuffled = [...questions];
  const random = createSeededRandom(attemptKey);
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
