
export enum Page {
  Home,
  Dashboard,
  PreCheck,
  Interview,
  Report,
}

export interface Session {
  id: string;
  role: string;
  date: string;
  aiEngine: 'Gemini' | 'GPT-4';
  score: number;
  status: 'Completed' | 'In Progress';
}

// Types based on the new API Specification
export interface Question {
  id: string;
  type: 'behavioral' | 'technical' | 'scenario';
  question: string;
}

export interface Feedback {
  clarity: { score: number; feedback: string };
  relevance: { score: number; feedback: string };
  starMethodAnalysis?: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  overallSuggestion: string;
}

export interface ReportItem {
  question: string;
  answerText: string;
  feedback: Feedback;
}

export interface Report {
  reportId: string;
  summary: string;
  metrics: {
    avgClarity: number;
    avgRelevance: number;
    durationSec: number;
  };
  items: ReportItem[];
}
