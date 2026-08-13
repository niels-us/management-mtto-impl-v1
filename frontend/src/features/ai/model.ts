export interface AIQueryRequest {
  question: string;
}

export interface AIQueryResponse {
  success: boolean;
  question: string;
  answer: string;
  dataSource: string;
  timestamp: string;
  processingTimeMs: number;
  error: string | null;
}

export interface AIHealthResponse {
  status: string;
  aiServiceAvailable: boolean;
  provider: string;
}
