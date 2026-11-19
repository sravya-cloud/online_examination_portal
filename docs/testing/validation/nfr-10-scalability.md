# Scalability Evaluation Report (NFR-10)

## Objective
Verify that the system can handle concurrent user load without workflow degradation or loss of transactional integrity (`VAL-N10`).

## Test Methodology
The automated scalability harness in `server/test/nfr10_scalability.test.js` generates concurrent HTTP requests simulating simultaneous candidates taking an examination:

1. **Concurrent Question Retrieval**: 50 simultaneous student requests fetch questions for an active exam.
2. **Concurrent Attempt Submission**: 50 simultaneous student requests record answers and submit attempt scores.

## Results

- **Concurrent Candidates Simulated**: 50
- **Total Requests Executed**: 100
- **Failed Requests / Dropped Connections**: 0 (0.00%)
- **Data Integrity**: Exactly 50 unique student attempts persisted with zero duplicate records, race conditions, or dropped answers.
- **Workflow Interruption**: None. The candidate workflow remained consistent under concurrent load.

## Conclusion
The system successfully handles concurrent student workloads meeting all requirements for NFR-10 (`VAL-N10`).
