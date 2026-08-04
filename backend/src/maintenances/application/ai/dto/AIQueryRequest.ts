import Joi from 'joi';
import { AIConstants } from '../../../../common/constants/AIConstants.js';

export class AIQueryRequest {
  question: string;

  customerId: string;

  constructor(question: string, customerId: string) {
    this.question = question;
    this.customerId = customerId;
  }

  static validationSchema() {
    return Joi.object({
      question: Joi.string()
        .required()
        .min(AIConstants.MIN_QUESTION_LENGTH)
        .max(AIConstants.MAX_QUESTION_LENGTH)
        .trim()
        .messages({
          'string.empty': 'Question cannot be empty',
          'string.min': `Question must have at least ${AIConstants.MIN_QUESTION_LENGTH} characters`,
          'string.max': `Question must not exceed ${AIConstants.MAX_QUESTION_LENGTH} characters`,
          'any.required': 'Question is required',
        }),
      customerId: Joi.string().uuid().required().messages({
        'string.guid': 'customerId must be a valid UUID',
        'any.required': 'customerId is required',
      }),
    });
  }

  static validate(data: any): AIQueryRequest {
    const { error, value } = this.validationSchema().validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((d) => d.message).join('; ');
      throw new Error(`Validation failed: ${messages}`);
    }

    return new AIQueryRequest(value.question, value.customerId);
  }
}
