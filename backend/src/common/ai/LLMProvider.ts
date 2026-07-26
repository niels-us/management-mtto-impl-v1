export interface LLMProvider {
  query(systemPrompt: string, userPrompt: string): Promise<string>;

  isConfigured(): boolean;

  getName(): string;
}
