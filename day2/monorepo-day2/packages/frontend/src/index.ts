import { IProblem, API_BASE_URL, PROBLEM_FETCH_TIMEOUT_MS } from 'shared';

console.log("\n--- Frontend Service Starting ---");
console.log("  Configuration:");
console.log(`    API Base URL: ${API_BASE_URL}`);
console.log(`    Problem Fetch Timeout: ${PROBLEM_FETCH_TIMEOUT_MS}ms`);

const currentProblem: IProblem = {
  id: 'LC-101',
  title: 'Two Sum',
  description: 'Given an array of integers...',
  difficulty: 'Easy',
  tags: ['Array', 'Hash Table']
};

console.log("\n  Displaying Problem Details (from shared type):");
console.log(`    ID: ${currentProblem.id}`);
console.log(`    Title: ${currentProblem.title}`);
console.log(`    Difficulty: ${currentProblem.difficulty}`);
console.log(`    Tags: ${currentProblem.tags.join(', ')}`);

// Simulate fetching a problem after some delay
setTimeout(() => {
  console.log("\n  Frontend: Problem data loaded successfully after a simulated fetch.");
  console.log("--- Frontend Service Finished ---");
}, PROBLEM_FETCH_TIMEOUT_MS / 2); // Half the actual timeout for demo purposes
