export interface OpenRouterModel {
  id: string;
  name: string;
}

export interface AITestComment {
  testName: string;
  status: string;
  analysis: string;
  suggestion: string;
  severity: "low" | "medium" | "high" | "critical";
}

export interface AIAnalysisResponse {
  summary: string;
  overallHealth: "good" | "fair" | "poor" | "critical";
  totalTests: number;
  passedTests: number;
  failedTests: number;
  passRate: number;
  comments: AITestComment[];
  recommendations: string[];
}
