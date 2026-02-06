import { IProblem, ISubmission, API_BASE_URL, PROBLEM_FETCH_TIMEOUT_MS } from 'shared';

console.log("\n--- Backend Service Starting ---");
console.log("  Configuration:");
console.log(`    API Base URL: ${API_BASE_URL}`);
console.log(`    Problem Fetch Timeout: ${PROBLEM_FETCH_TIMEOUT_MS}ms (server-side)`);

// Simulate receiving a problem definition from a database or another service
const problemDefinition: IProblem = {
  id: 'LC-101',
  title: 'Two Sum',
  description: 'Find two numbers that add up to a target.',
  difficulty: 'Easy',
  tags: ['Array', 'Hashing']
};

console.log("\n  Processing incoming Problem Definition (using shared type):");
console.log(`    Problem ID: ${problemDefinition.id}`);
console.log(`    Problem Title: ${problemDefinition.title}`);

// Simulate receiving a submission from the frontend
const userSubmission: ISubmission = {
  submissionId: 'sub-xyz-123',
  problemId: 'LC-101',
  userId: 'user-abc-456',
  code: 'function twoSum(nums, target) { /* ... */ }',
  language: 'javascript',
  status: 'Pending',
  timestamp: new Date()
};

console.log("\n  Processing User Submission (using shared type):");
console.log(`    Submission ID: ${userSubmission.submissionId}`);
console.log(`    Problem ID: ${userSubmission.problemId}`);
console.log(`    Status: ${userSubmission.status}`);
console.log(`    Language: ${userSubmission.language}`);

// Simulate a long-running process like judging a submission
setTimeout(() => {
  console.log("\n  Backend: Submission processed and judged. Status updated.");
  userSubmission.status = 'Accepted'; // Update status
  console.log(`    Updated Submission Status: ${userSubmission.status}`);
  console.log("--- Backend Service Finished ---");
}, PROBLEM_FETCH_TIMEOUT_MS);
