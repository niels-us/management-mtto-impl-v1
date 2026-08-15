import { defineFeature, loadFeature } from 'jest-cucumber';
import { handler } from '../../../../src/maintenances/infrastructure/bootstrap/App';
import { MaintenanceDynamoRepository } from '../../../../src/maintenances/infrastructure/repository/MaintenanceDynamoRepository';
import { GroqLLMProvider } from '../../../../src/common/ai/GroqLLMProvider';
import { Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { buildRequest } from '../util/AwsTestHelper';
import { Vessel } from '../../../../src/maintenances/domain/entities/Vessel';
import { Component } from '../../../../src/maintenances/domain/entities/Component';
import { Maintenance } from '../../../../src/maintenances/domain/entities/Maintenance';
import * as path from 'path';

const feature = loadFeature(path.join(__dirname, '../query-ai.feature'));

const CUSTOMER_ID = '88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b';
const USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const VESSEL_ID = '061658b9-bf29-4e88-b0ec-c92ff540ac99';
const COMPONENT_ID = 'c4e9f3e8-5c1a-4a2f-8b3c-9a8d7e6f5c4b';
const MAINTENANCE_ID = 'a9b8c7d6-e5f4-4c3b-8a97-6e5f4d3c2b1a';

const createLambdaContext = () => ({
  callbackWaitsForEmptyEventLoop: true,
  functionName: 'test',
  functionVersion: '1',
  invokedFunctionArn: 'arn',
  memoryLimitInMB: '128',
  awsRequestId: 'id',
  logGroupName: 'log',
  logStreamName: 'stream',
  getRemainingTimeInMillis: () => 300000,
  done: () => {},
  fail: () => {},
  succeed: () => {}
});

const createJWT = (customerId: string = CUSTOMER_ID, expiresIn: string = '8h') => {
  const secret = process.env.JWT_SECRET || 'test-secret-key-for-unit-tests-min-32';
  return jwt.sign(
    { sub: USER_ID, username: 'tester', customerId },
    secret,
    {
      expiresIn: expiresIn as any,
      algorithm: 'HS256' as any,
      audience: process.env.JWT_AUDIENCE || 'maintenance-api',
      issuer: process.env.JWT_ISSUER || 'maintenance-api'
    }
  );
};

const mockVessels = () => [
  new Vessel({ id: VESSEL_ID, name: 'Maritime Princess', registrationNumber: 'MP-001', customerId: CUSTOMER_ID }),
  new Vessel({ id: 'd6c5b4a3-f2e1-4d9c-8b7a-6f5e4d3c2b1a', name: 'Ocean Voyager', registrationNumber: 'OV-002', customerId: CUSTOMER_ID })
];

const mockComponents = () => [
  new Component({ id: COMPONENT_ID, name: 'Main Engine', vesselId: VESSEL_ID, customerId: CUSTOMER_ID, serialNumber: 'SN-ME-12345' }),
  new Component({ id: 'comp-002', name: 'Water Pump', vesselId: VESSEL_ID, customerId: CUSTOMER_ID, serialNumber: 'SN-WP-67890' })
];

const mockMaintenances = () => [
  new Maintenance({ id: MAINTENANCE_ID, componentId: COMPONENT_ID, customerId: CUSTOMER_ID, description: 'Oil change', status: 'pending', scheduledAt: new Date('2026-04-15T10:00:00Z'), createdBy: USER_ID }),
  new Maintenance({ id: 'maint-002', componentId: COMPONENT_ID, customerId: CUSTOMER_ID, description: 'Filter replacement', status: 'in_progress', scheduledAt: new Date('2026-04-20T09:00:00Z'), createdBy: USER_ID })
];

defineFeature(feature, (test) => {
  let request: any;
  let response: any;
  const action = 'queryAI';

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-key-for-unit-tests-min-32';
    process.env.JWT_AUDIENCE = 'maintenance-api';
    process.env.JWT_ISSUER = 'maintenance-api';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── Shared Given Steps ────────────────────────────────────────────────────

  const givenJwtConfigured = (given: any) => {
    given('The JWT secret is configured', () => {
      process.env.JWT_SECRET = 'test-secret-key-for-unit-tests-min-32';
    });
  };

  const givenRepositoriesWithData = (given: any) => {
    given('The repositories return vessels, components and maintenances for the customer', () => {
      const vessels = mockVessels();
      jest.spyOn(MaintenanceDynamoRepository.prototype, 'findAllByCustomer').mockResolvedValue(vessels);
      jest.spyOn(MaintenanceDynamoRepository.prototype, 'findVesselById').mockResolvedValue(vessels[0]);
      jest.spyOn(MaintenanceDynamoRepository.prototype, 'findAllByVessel').mockResolvedValue(mockComponents());
      jest.spyOn(MaintenanceDynamoRepository.prototype, 'findMaintenanceByCustomer').mockResolvedValue(mockMaintenances());
    });
  };

  const givenRepositoriesEmpty = (given: any) => {
    given('The repositories return no vessels for the customer', () => {
      jest.spyOn(MaintenanceDynamoRepository.prototype, 'findAllByCustomer').mockResolvedValue([]);
      jest.spyOn(MaintenanceDynamoRepository.prototype, 'findAllByVessel').mockResolvedValue([]);
      jest.spyOn(MaintenanceDynamoRepository.prototype, 'findMaintenanceByCustomer').mockResolvedValue([]);
    });
  };

  const givenLLMConfigured = (and: any) => {
    and('The LLM provider is configured and available', () => {
      jest.spyOn(GroqLLMProvider.prototype, 'isConfigured').mockReturnValue(true);
      jest.spyOn(GroqLLMProvider.prototype, 'query').mockResolvedValue(
        'Ho trovato 2 imbarcazioni nel tuo account: Maritime Princess (MP-001) e Ocean Voyager (OV-002).'
      );
    });
  };

  const givenLLMConfiguredAlone = (given: any) => {
    given('The LLM provider is configured and available', () => {
      jest.spyOn(GroqLLMProvider.prototype, 'isConfigured').mockReturnValue(true);
      jest.spyOn(GroqLLMProvider.prototype, 'query').mockResolvedValue('I found your maintenance records.');
    });
  };

  // ─── Scenario 1: Italian question ─────────────────────────────────────────

  test('Successful AI query in Italian language', ({ given, and, when, then }) => {
    givenJwtConfigured(given);
    givenRepositoriesWithData(given);
    givenLLMConfigured(and);

    when(/^The user sends the question "(.*)" with a valid JWT token$/, async (question: string) => {
      request = buildRequest(action, { payload: { question } });
      request.headers = { Authorization: `Bearer ${createJWT()}` };
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then('The AI response is successful with an answer', () => {
      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.question).toEqual('Elenca le mie imbarcazioni');
      expect(response.answer).toBeDefined();
      expect(response.answer.length).toBeGreaterThan(0);
      expect(response.dataSource).toEqual('database');
      expect(response.timestamp).toBeDefined();
    });
  });

  // ─── Scenario 2: English question ─────────────────────────────────────────

  test('Successful AI query in English language', ({ given, and, when, then }) => {
    givenJwtConfigured(given);
    givenRepositoriesWithData(given);
    givenLLMConfigured(and);

    when(/^The user sends the question "(.*)" with a valid JWT token$/, async (question: string) => {
      request = buildRequest(action, { payload: { question } });
      request.headers = { Authorization: `Bearer ${createJWT()}` };
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then('The AI response is successful with an answer', () => {
      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.answer).toBeDefined();
      expect(response.dataSource).toEqual('database');
    });
  });

  // ─── Scenario 3: No vessels ────────────────────────────────────────────────

  test('AI query when customer has no vessels', ({ given, and, when, then }) => {
    givenJwtConfigured(given);
    givenRepositoriesEmpty(given);
    givenLLMConfigured(and);

    when(/^The user sends the question "(.*)" with a valid JWT token$/, async (question: string) => {
      request = buildRequest(action, { payload: { question } });
      request.headers = { Authorization: `Bearer ${createJWT()}` };
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then('The AI response is successful with an answer', () => {
      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.answer).toBeDefined();
    });
  });

  // ─── Scenario 4: LLM not configured ───────────────────────────────────────

  test('AI query when LLM provider is not configured', ({ given, and, when, then }) => {
    givenJwtConfigured(given);
    givenRepositoriesWithData(given);

    and('The LLM provider is NOT configured', () => {
      jest.spyOn(GroqLLMProvider.prototype, 'isConfigured').mockReturnValue(false);
    });

    when(/^The user sends the question "(.*)" with a valid JWT token$/, async (question: string) => {
      request = buildRequest(action, { payload: { question } });
      request.headers = { Authorization: `Bearer ${createJWT()}` };
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then('The AI response returns success false with an error message', () => {
      expect(response).toBeDefined();
      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.dataSource).toEqual('error');
    });
  });

  // ─── Scenario 5: LLM throws error ─────────────────────────────────────────

  test('AI query when LLM provider throws an error', ({ given, and, when, then }) => {
    givenJwtConfigured(given);
    givenRepositoriesWithData(given);

    and('The LLM provider is configured but throws an error', () => {
      jest.spyOn(GroqLLMProvider.prototype, 'isConfigured').mockReturnValue(true);
      jest.spyOn(GroqLLMProvider.prototype, 'query').mockRejectedValue(new Error('LLM service timeout'));
    });

    when(/^The user sends the question "(.*)" with a valid JWT token$/, async (question: string) => {
      request = buildRequest(action, { payload: { question } });
      request.headers = { Authorization: `Bearer ${createJWT()}` };
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then('The AI response returns success false with an error message', () => {
      expect(response).toBeDefined();
      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.dataSource).toEqual('error');
    });
  });

  // ─── Scenario 6: No authentication ────────────────────────────────────────

  test('AI query fails when user is not authenticated', ({ given, when, then }) => {
    givenJwtConfigured(given);

    given('No authentication header is present', () => {
      // no additional setup needed
    });

    when(/^The user sends the question "(.*)" without a JWT token$/, async (question: string) => {
      request = buildRequest(action, { payload: { question } });
      request.headers = {};
      jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then('The response should be an authentication error AUTH001', () => {
      expect(response).toBeDefined();
      const isAuthError =
        (response instanceof Error && response.message.includes('authenticated')) ||
        (response && response.code === 'AUTH001') ||
        (response && response.message && response.message.includes('authenticated'));
      expect(isAuthError).toBe(true);
    });
  });

  // ─── Scenario 7: Invalid JWT ───────────────────────────────────────────────

  test('AI query fails with an invalid JWT token', ({ given, when, then }) => {
    givenJwtConfigured(given);

    given('An invalid JWT token is provided', () => {
      // no additional setup needed
    });

    when(/^The user sends the question "(.*)" with an invalid JWT token$/, async (question: string) => {
      request = buildRequest(action, { payload: { question } });
      request.headers = { Authorization: 'Bearer invalid.jwt.token' };
      jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then('The response should be an authentication error AUTH001', () => {
      expect(response).toBeDefined();
      const isAuthError =
        (response instanceof Error && (response.message.includes('token') || response.message.includes('Invalid') || response.message.includes('AUTH001'))) ||
        (response && response.code === 'AUTH001') ||
        (response && response.message && (response.message.includes('token') || response.message.includes('Invalid')));
      expect(isAuthError).toBe(true);
    });
  });

  // ─── Scenario 8: Missing question ─────────────────────────────────────────

  test('AI query fails when question is missing in payload', ({ given, when, then }) => {
    givenJwtConfigured(given);
    givenLLMConfiguredAlone(given);

    when('The user sends a request with no question in the payload with a valid JWT token', async () => {
      request = buildRequest(action, { payload: {} });
      request.headers = { Authorization: `Bearer ${createJWT()}` };
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then('The response should be a validation error with status 400', () => {
      expect(response).toBeDefined();
      const isValidationError =
        (response instanceof Error && response.message.toLowerCase().includes('question')) ||
        (response && response.httpStatus === 400) ||
        (response && response.message && response.message.toLowerCase().includes('question'));
      expect(isValidationError).toBe(true);
    });
  });

  // ─── Scenario 9: Question too short ───────────────────────────────────────

  test('AI query fails when question is too short', ({ given, when, then }) => {
    givenJwtConfigured(given);
    givenLLMConfiguredAlone(given);

    when(/^The user sends the question "(.*)" with a valid JWT token$/, async (question: string) => {
      request = buildRequest(action, { payload: { question } });
      request.headers = { Authorization: `Bearer ${createJWT()}` };
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then('The response should be a validation error with status 400', () => {
      expect(response).toBeDefined();
      const isValidationError =
        (response instanceof Error && (response.message.toLowerCase().includes('question') || response.message.toLowerCase().includes('validation') || response.message.toLowerCase().includes('least'))) ||
        (response && response.httpStatus === 400) ||
        (response && response.message && (response.message.toLowerCase().includes('question') || response.message.toLowerCase().includes('validation')));
      expect(isValidationError).toBe(true);
    });
  });

  // ─── Scenario 10: Question too long ───────────────────────────────────────

  test('AI query fails when question is too long', ({ given, when, then }) => {
    givenJwtConfigured(given);
    givenLLMConfiguredAlone(given);

    when('The user sends a question exceeding 500 characters with a valid JWT token', async () => {
      const longQuestion = 'A'.repeat(501);
      request = buildRequest(action, { payload: { question: longQuestion } });
      request.headers = { Authorization: `Bearer ${createJWT()}` };
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then('The response should be a validation error with status 400', () => {
      expect(response).toBeDefined();
      const isValidationError =
        (response instanceof Error && (response.message.toLowerCase().includes('question') || response.message.toLowerCase().includes('validation') || response.message.toLowerCase().includes('exceed'))) ||
        (response && response.httpStatus === 400) ||
        (response && response.message && (response.message.toLowerCase().includes('question') || response.message.toLowerCase().includes('validation')));
      expect(isValidationError).toBe(true);
    });
  });

  // ─── Scenario 11: Health check - authenticated ────────────────────────────

  test('Health check returns AI service status when authenticated', ({ given, when, then }) => {
    givenJwtConfigured(given);
    givenLLMConfiguredAlone(given);

    when('The user calls the health check endpoint with a valid JWT token', async () => {
      jest.spyOn(GroqLLMProvider.prototype, 'getName').mockReturnValue('Groq (llama-3.3-70b-versatile)');
      request = buildRequest('healthCheck', { payload: {} });
      request.headers = { Authorization: `Bearer ${createJWT()}` };
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then('The health check response contains AI service availability', () => {
      expect(response).toBeDefined();
      expect(response.status).toEqual('ok');
      expect(typeof response.aiServiceAvailable).toBe('boolean');
      expect(response.provider).toBeDefined();
    });
  });

  // ─── Scenario 12: Health check - not authenticated ───────────────────────

  test('Health check fails when user is not authenticated', ({ given, when, then }) => {
    givenJwtConfigured(given);

    given('No authentication header is present', () => {
      // no additional setup needed
    });

    when('The user calls the health check endpoint without a JWT token', async () => {
      request = buildRequest('healthCheck', { payload: {} });
      request.headers = {};
      jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then('The response should be an authentication error AUTH001', () => {
      expect(response).toBeDefined();
      const isAuthError =
        (response instanceof Error && response.message.includes('authenticated')) ||
        (response && response.code === 'AUTH001') ||
        (response && response.message && response.message.includes('authenticated'));
      expect(isAuthError).toBe(true);
    });
  });
});
