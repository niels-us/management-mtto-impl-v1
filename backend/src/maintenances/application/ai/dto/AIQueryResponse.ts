export class AIQueryResponse {
  success: boolean;

  question: string;

  answer: string;

  dataSource: 'database' | 'cache' | 'error';

  timestamp: string;

  error?: string;

  processingTimeMs?: number;

  constructor(
    success: boolean,
    question: string,
    answer: string,
    dataSource: 'database' | 'cache' | 'error' = 'database',
    error?: string,
    processingTimeMs?: number
  ) {
    this.success = success;
    this.question = question;
    this.answer = answer;
    this.dataSource = dataSource;
    this.error = error;
    this.timestamp = new Date().toISOString();
    this.processingTimeMs = processingTimeMs;
  }

  static success(question: string, answer: string, processingTimeMs?: number): AIQueryResponse {
    return new AIQueryResponse(true, question, answer, 'database', undefined, processingTimeMs);
  }

  static error(question: string, errorMessage: string, processingTimeMs?: number): AIQueryResponse {
    return new AIQueryResponse(false, question, '', 'error', errorMessage, processingTimeMs);
  }

  toJSON(): any {
    return {
      success: this.success,
      question: this.question,
      answer: this.answer,
      dataSource: this.dataSource,
      timestamp: this.timestamp,
      processingTimeMs: this.processingTimeMs,
      ...(this.error && { error: this.error }),
    };
  }
}
