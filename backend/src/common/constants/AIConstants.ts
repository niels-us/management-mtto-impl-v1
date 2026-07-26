export class AIConstants {
  static readonly SYSTEM_PROMPTS = {
    en: `You are a technical assistant specialized in vessel maintenance.
Your goal is to help technicians query maintenance history, technical documentation, and components.

INSTRUCTIONS:
1. Always respond in English
2. Be precise and technical but understandable
3. Include dates, statuses, and relevant details
4. When there are multiple results, present in an organized and readable format
5. If data is missing, clearly indicate what information is not available
6. Always keep security and multi-tenancy context in mind`,

    it: `Sei un assistente tecnico specializzato nella manutenzione delle navi.
Il tuo obiettivo è aiutare i tecnici a consultare la cronologia di manutenzione, la documentazione tecnica e i componenti.

ISTRUZIONI:
1. Rispondi sempre in italiano
2. Sii preciso e tecnico ma comprensibile
3. Includi date, stati e dettagli rilevanti
4. Quando ci sono più risultati, presenta in un formato organizzato e leggibile
5. Se mancano dati, indica chiaramente quali informazioni non sono disponibili
6. Tieni sempre in considerazione il contesto di sicurezza e multi-tenancy`,
  };

  static readonly LANGUAGE_KEYWORDS = {
    it: [
      'imbarcazioni',
      'manutenzione',
      'componenti',
      'cronologia',
      'quale',
      'quanti',
      'dove',
      'che ha',
      'elenco',
      'storico',
      'filtro',
      'questo',
      'quello',
      'qui',
    ],
    en: [
      'vessels',
      'maintenance',
      'components',
      'history',
      'which',
      'how many',
      'where',
      'that has',
      'list',
      'record',
      'filter',
      'this',
      'that',
      'here',
    ],
  };

  static readonly MAX_TOKENS = 1000;
  static readonly TEMPERATURE = 0.3;

  static readonly LLM_REQUEST_TIMEOUT_MS = 30000;
  static readonly LLM_RETRY_ATTEMPTS = 3;
  static readonly LLM_RETRY_DELAY_MS = 1000;

  static readonly GROQ_MODEL = 'llama-3.3-70b-versatile';

  static readonly MIN_QUESTION_LENGTH = 3;
  static readonly MAX_QUESTION_LENGTH = 500;

  static readonly RATE_LIMIT_REQUESTS_PER_MINUTE = 10;
  static readonly RATE_LIMIT_REQUESTS_PER_HOUR = 100;

  static readonly INTENT_PATTERNS = {
    LIST: [
      'list',
      'show',
      'give',
      'which',
      'see',
      'get',
      'display',
      'lista',
      'mostra',
      'dammi',
      'quale',
      'vedere',
      'ottenere',
      'visualizza',
    ],
    FILTER: ['filter', 'where', 'search', 'with', 'that has', 'filtra', 'dove', 'cerca', 'con', 'che ha'],
    HISTORY: ['history', 'past', 'previous', 'record', 'before', 'storico', 'passato', 'precedente', 'record', 'prima'],
    COUNT: ['how many', 'count', 'quantity', 'total', 'number', 'quanti', 'conta', 'quantità', 'totale', 'numero'],
    DETAILS: [
      'details',
      'information',
      'data',
      'specifications',
      'info',
      'dettagli',
      'informazioni',
      'dati',
      'specifiche',
      'info',
    ],
  };

  static detectLanguage(question: string): 'en' | 'it' {
    const lowerQuestion = question.toLowerCase();

    let enCount = 0;
    let itCount = 0;

    this.LANGUAGE_KEYWORDS.en.forEach((keyword) => {
      if (lowerQuestion.includes(keyword)) {
        enCount++;
      }
    });

    this.LANGUAGE_KEYWORDS.it.forEach((keyword) => {
      if (lowerQuestion.includes(keyword)) {
        itCount++;
      }
    });

    if (
      lowerQuestion.includes('à') ||
      lowerQuestion.includes('è') ||
      lowerQuestion.includes('é') ||
      lowerQuestion.includes('ì') ||
      lowerQuestion.includes('ò') ||
      lowerQuestion.includes('ù')
    ) {
      itCount += 2;
    }

    return itCount > enCount ? 'it' : 'en';
  }

  static getSystemPrompt(question: string): string {
    const language = this.detectLanguage(question);
    return this.SYSTEM_PROMPTS[language];
  }
}
