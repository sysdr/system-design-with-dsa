// Shared Type Definitions
export interface IProblem {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
}

export interface ISubmission {
  submissionId: string;
  problemId: string;
  userId: string;
  code: string;
  language: 'javascript' | 'python' | 'java' | 'cpp';
  status: 'Pending' | 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error';
  timestamp: Date;
}

// Shared Configuration Constants
export * from './config';
