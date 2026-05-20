export type TestStatus = "passed" | "failed" | "error" | "skipped";

export interface FilterState {
  statusFilters: TestStatus[];
  searchQuery: string;
  minTime: number | null;
  maxTime: number | null;
}

export interface TestSuite {
  name: string;
  tests: number;
  failures: number;
  errors: number;
  skipped: number;
  time: number;
  timestamp?: string;
  properties?: Record<string, string>;
  testCases: TestCase[];
}

export interface TestCase {
  name: string;
  classname: string;
  time: number;
  status: "passed" | "failed" | "error" | "skipped";
  failure?: {
    message: string;
    type: string;
    stackTrace: string;
  };
  error?: {
    message: string;
    type: string;
    stackTrace: string;
  };
  skipped?: {
    message?: string;
  };
}
