import { defineFeature, loadFeature } from 'jest-cucumber';
import { handler } from '../../../../src/maintenances/infrastructure/bootstrap/App';
import { MaintenanceDynamoRepository } from '../../../../src/maintenances/infrastructure/repository/MaintenanceDynamoRepository';
import { Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import {
  buildRequest,
  getExpectedErrorResponse,
  getExpectedResponse,
  getInputPayload,
  getMockData
} from '../util/AwsTestHelper';
import { Maintenance } from '../../../../src/maintenances/domain/entities/Maintenance';
import { Component } from '../../../../src/maintenances/domain/entities/Component';
import * as path from 'path';

const feature = loadFeature(path.join(__dirname, '../create-maintenance.feature'));

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

const createJWT = (customerId: string = '88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b') => {
  const secret = process.env.JWT_SECRET || 'test-secret-key-for-unit-tests-min-32';
  const token = jwt.sign(
    { sub: '550e8400-e29b-41d4-a716-446655440000', username: 'tester', customerId },
    secret,
    {
      expiresIn: '8h',
      algorithm: 'HS256',
      audience: process.env.JWT_AUDIENCE || 'maintenance-api',
      issuer: process.env.JWT_ISSUER || 'maintenance-api'
    }
  );
  return token;
};

defineFeature(feature, (test) => {
  let request: any;
  let response: any;
  let action: string = 'createMaintenance';

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-key-for-unit-tests-min-32';
    process.env.JWT_AUDIENCE = 'maintenance-api';
    process.env.JWT_ISSUER = 'maintenance-api';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('Executing create maintenance service with valid authentication', ({ given, and, when, then }) => {
    let token: string;
    let mockComponent: Component;

    given(/^Enter a maintenance payload (.*) (.*)$/, async (input: string, dataObject: string) => {
      const payload = getInputPayload(input)[dataObject];
      request = buildRequest(action, payload);
    });

    and(/^Wait for component repository response (.*) (.*) (.*)$/, async (status: string, mockData: string, mockObject: string) => {
      if (status === 'ok') {
        mockComponent = new Component({
          id: 'c4e9f3e8-5c1a-4a2f-8b3c-9a8d7e6f5c4b',
          name: 'Engine',
          vesselId: 'e7d6c5b4-a3f2-4e1d-9c8b-7a6f5e4d3c2b',
          customerId: '88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b',
          serialNumber: 'ENG-001',
          installedAt: new Date()
        });
        jest.spyOn(MaintenanceDynamoRepository.prototype, 'findById').mockResolvedValue(mockComponent);
      }
    });

    when('Execute the createMaintenance action with JWT token', async () => {
      token = createJWT('88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b');
      request.headers = { Authorization: `Bearer ${token}` };
      
      // Mock the createMaintenance method
      jest.spyOn(MaintenanceDynamoRepository.prototype, 'createMaintenance').mockResolvedValue(
        new Maintenance({
          id: 'a9b8c7d6-e5f4-4c3b-8a97-6e5f4d3c2b1a',
          componentId: 'c4e9f3e8-5c1a-4a2f-8b3c-9a8d7e6f5c4b',
          customerId: '88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b',
          description: 'Engine oil change',
          scheduledAt: new Date('2026-04-15T10:00:00Z'),
          createdBy: '550e8400-e29b-41d4-a716-446655440000',
          status: 'pending'
        })
      );
      
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then(/^The response will be displayed as maintenance (.*) (.*)$/, async (result: string, dataObject: string) => {
      const expectedResponse = getExpectedResponse(result)[dataObject];
      
      // Response should be a Maintenance object
      expect(response).toBeDefined();
      expect(response.description).toEqual(expectedResponse.description);
      expect(response.componentId).toEqual(expectedResponse.componentId);
      expect(response.status).toEqual(expectedResponse.status || 'pending');
    });
  });

  test('Unauthorized - Missing authentication header returns error', ({ given, when, then }) => {
    given(/^Enter a maintenance payload (.*) (.*)$/, async (input: string, dataObject: string) => {
      const payload = getInputPayload(input)[dataObject];
      request = buildRequest(action, payload);
    });

    when('Execute the createMaintenance action without JWT token', async () => {
      request.headers = {}; // No Authorization header
      
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then(/^The response should be an authentication error with message "(.+)"$/, async (expectedMessage: string) => {
      if (response instanceof Error) {
        expect(response.message).toEqual(expectedMessage);
      } else if (response && response.message) {
        expect(response.message).toEqual(expectedMessage);
      } else {
        fail('Expected error response but got: ' + JSON.stringify(response));
      }
    });
  });

  test('Invalid JWT token returns unauthorized error', ({ given, when, then }) => {
    let loggerErrorSpy: jest.SpyInstance;

    given(/^Enter a maintenance payload (.*) (.*)$/, async (input: string, dataObject: string) => {
      const payload = getInputPayload(input)[dataObject];
      request = buildRequest(action, payload);
    });

    when('Execute the createMaintenance action with invalid JWT token', async () => {
      request.headers = { Authorization: 'Bearer invalid.token.here' };
      loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
      
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      } finally {
        loggerErrorSpy.mockRestore();
      }
    });

    then(/^The response should be an authentication error with message "(.+)"$/, async (expectedMessage: string) => {
      if (response instanceof Error) {
        expect(response.message).toEqual(expectedMessage);
      } else if (response && response.message) {
        expect(response.message).toEqual(expectedMessage);
      } else {
        fail('Expected error response but got: ' + JSON.stringify(response));
      }
    });
  });

  test('Bad request - Missing required fields returns validation error', ({ given, when, then }) => {
    let token: string;

    given(/^Enter a maintenance payload (.*) (.*)$/, async (input: string, dataObject: string) => {
      const payload = getInputPayload(input)[dataObject];
      request = buildRequest(action, payload);
    });

    when('Execute the createMaintenance action with JWT token', async () => {
      token = createJWT('cust-abc');
      request.headers = { Authorization: `Bearer ${token}` };
      
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then(/^The response should be a validation error with message (.+)$/, async (expectedMessage: string) => {
      // Remove quotes if present
      const cleanMessage = expectedMessage.replace(/^"|"$/g, '');
      
      if (response instanceof Error) {
        expect(response.message).toEqual(cleanMessage);
      } else if (response && response.message) {
        expect(response.message).toEqual(cleanMessage);
      } else {
        fail('Expected error response but got: ' + JSON.stringify(response));
      }
    });
  });

  test('Access denied - Wrong customer returns error', ({ given, when, then }) => {
    let token: string;

    given(/^Enter a maintenance payload (.*) (.*)$/, async (input: string, dataObject: string) => {
      const payload = getInputPayload(input)[dataObject];
      request = buildRequest(action, payload);
    });

    when('Execute the createMaintenance action with JWT token', async () => {
      token = createJWT('cust-abc'); // Token for cust-abc, but payload has different-cust
      request.headers = { Authorization: `Bearer ${token}` };
      
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then(/^The response should be an access denied error with message "(.+)"$/, async (expectedMessage: string) => {
      if (response instanceof Error) {
        expect(response.message).toEqual(expectedMessage);
      } else if (response && response.message) {
        expect(response.message).toEqual(expectedMessage);
      } else {
        fail('Expected error response but got: ' + JSON.stringify(response));
      }
    });
  });

  test('Component not found - Non-existent component returns error', ({ given, and, when, then }) => {
    let token: string;

    given(/^Enter a maintenance payload (.*) (.*)$/, async (input: string, dataObject: string) => {
      const payload = getInputPayload(input)[dataObject];
      request = buildRequest(action, payload);
    });

    and('Component does not exist in repository', async () => {
      // Mock findById to return null for non-existent component
      jest.spyOn(MaintenanceDynamoRepository.prototype, 'findById').mockResolvedValue(null);
    });

    when('Execute the createMaintenance action with JWT token', async () => {
      token = createJWT('cust-abc');
      request.headers = { Authorization: `Bearer ${token}` };
      
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then(/^The response should be a component error with message "(.+)"$/, async (expectedMessage: string) => {
      if (response instanceof Error) {
        expect(response.message).toEqual(expectedMessage);
      } else if (response && response.message) {
        expect(response.message).toEqual(expectedMessage);
      } else {
        fail('Expected error response but got: ' + JSON.stringify(response));
      }
    });
  });
});
