# Unit Test Report

**Run date:** 19 November 2026
**Revision:** `e51bfdd` (`Complete student exam evaluation and validation`)
**Scope:** deterministic objective scoring and evaluation helpers.

## Execution

Command, from `server/`:

```text
node --test --test-name-pattern="FR-17: score is|FR-17: invalid|FR-17: scoring preserves|FR-16: evaluates correct" test/fr17_scoring.test.js
```

## Results

| Test | Result |
| --- | --- |
| Correct answers contribute to score; unanswered answers contribute zero | PASS |
| Invalid question/answer containers are rejected | PASS |
| Option-index and case-insensitive answer compatibility | PASS |
| Correct, incorrect, and unanswered per-question evaluation | PASS |

**Summary:** 4 passed, 0 failed, 0 skipped.

The report is intentionally scoped to the pure scoring/evaluation tests. Route persistence, result-release gating, database persistence, and browser behavior are tracked in the system-test report and traceability matrix; they are not represented as unit-test passes here.
