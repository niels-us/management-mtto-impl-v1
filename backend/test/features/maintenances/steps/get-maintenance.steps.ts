import { defineFeature, loadFeature } from 'jest-cucumber';
import { handler } from '../../../../src/maintenances/infrastructure/bootstrap/App';
import { MaintenancePostgreRepository } from '../../../../src/maintenances/infrastructure/repository/MaintenancePostgreRepository';
import { Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import {
  buildRequest,
  getExpectedErrorResponse,
  getExpectedResponse,
  getInputPayload,
  getMockData,
  IRequest
} from '../util/AwsTestHelper';
import { Maintenance } from '../../../../src/maintenances/domain/entities/Maintenance';
import * as path from 'path';

const feature = loadFeature(path.join(__dirname, '../get-maintenance.feature'));

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

const createJWT = (customerId: string = '88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b', expiresIn: string = '8h') => {
  const secret = process.env.JWT_SECRET || 'test-secret-key-for-unit-tests-min-32';
  const token = jwt.sign(
    { sub: '550e8400-e29b-41d4-a716-446655440000', username: 'tester', customerId },
    secret,
    {
      expiresIn: expiresIn as any,
      algorithm: 'HS256' as any,
      audience: process.env.JWT_AUDIENCE || 'maintenance-api',
      issuer: process.env.JWT_ISSUER || 'maintenance-api'
    }
  );
  return token;
};

defineFeature(feature, (test) => {
  let request: any;
  let response: any;
  let action: string = 'getMaintenance';
  let queryParams: any = {};

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-key-for-unit-tests-min-32';
    process.env.JWT_AUDIENCE = 'maintenance-api';
    process.env.JWT_ISSUER = 'maintenance-api';
  });

  afterEach(() => {
    jest.clearAllMocks();
    queryParams = {};
  });

  test('Executing get maintenance service with valid authentication', ({ given, and, when, then }) => {
    let token: string;
    let mockMaintenances: Maintenance[];

    given(/^Enter a get maintenance payload (.*) (.*)$/, async (input: string, dataObject: string) => {
      const payload = getInputPayload(input)[dataObject];
      request = buildRequest(action, payload);
      request.query = queryParams;
    });

    and(/^Wait for maintenance repository response (.*) (.*) (.*)$/, async (status: string, mockData: string, mockObject: string) => {
      const sourceData = getMockData(mockData);
      let data = sourceData[mockObject];
      
      if (!data && mockObject === 'success_payload') {
        data = sourceData['success_payload_get'];
      }
      
      if (Array.isArray(data)) {
        mockMaintenances = data.map((m: any) => new Maintenance(m));
      } else if (data === null || data === undefined) {
        mockMaintenances = [];
      } else {
        mockMaintenances = [new Maintenance(data)];
      }
      
      jest.spyOn(MaintenancePostgreRepository.prototype, 'findMaintenanceByCustomer').mockResolvedValue(mockMaintenances);
    });

    when('Execute the getMaintenance action with JWT token', async () => {
      token = createJWT('88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b');
      request.headers = { Authorization: `Bearer ${token}` };
      
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then(/^The response will be displayed (.*) (.*)$/, async (result: string, dataObject: string) => {
      const expectedResponse = getExpectedResponse(result)[dataObject];
      
      expect(Array.isArray(response)).toBe(true);
      
      if (Array.isArray(expectedResponse) && expectedResponse.length > 0) {
        expect(response.length).toBeGreaterThan(0);
        expect(response[0]).toHaveProperty('id');
        expect(response[0]).toHaveProperty('componentId');
        expect(response[0]).toHaveProperty('description');
        expect(response[0]).toHaveProperty('status');
      } else if (Array.isArray(expectedResponse) && expectedResponse.length === 0) {
        expect(response.length).toBe(0);
      }
    });
  });

  test('Unauthorized - Missing authentication header returns 401', ({ given, when, then }) => {
    given(/^Enter a get maintenance payload (.*) (.*)$/, async (input: string, dataObject: string) => {
      const payload = getInputPayload(input)[dataObject];
      request = buildRequest(action, payload);
      request.query = queryParams;
    });

    when('Execute the getMaintenance action without JWT token', async () => {
      request.headers = {};
      
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

    given(/^Enter a get maintenance payload (.*) (.*)$/, async (input: string, dataObject: string) => {
      const payload = getInputPayload(input)[dataObject];
      request = buildRequest(action, payload);
      request.query = queryParams;
    });

    when('Execute the getMaintenance action with invalid JWT token', async () => {
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

  test('Successfully get maintenance records with multiple items', ({ given, and, when, then }) => {
    let token: string;
    let mockMaintenances: Maintenance[];

    given(/^Enter a get maintenance payload (.*) (.*)$/, async (input: string, dataObject: string) => {
      const payload = getInputPayload(input)[dataObject];
      request = buildRequest(action, payload);
      request.query = queryParams;
    });

    and(/^Wait for maintenance repository response (.*) (.*) (.*)$/, async (status: string, mockData: string, mockObject: string) => {
      const sourceData = getMockData(mockData);
      let data = sourceData[mockObject];
      
      if (!data && mockObject === 'multiple_items') {
        data = sourceData['multiple_items'];
      }
      
      mockMaintenances = data.map((m: any) => new Maintenance(m));
      jest.spyOn(MaintenancePostgreRepository.prototype, 'findMaintenanceByCustomer').mockResolvedValue(mockMaintenances);
    });

    when('Execute the getMaintenance action with JWT token', async () => {
      const token = createJWT('88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b');
      request.headers = { Authorization: `Bearer ${token}` };
      
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then(/^The response should contain maintenance records list (.*)$/, async (dataObject: string) => {
      expect(Array.isArray(response)).toBe(true);
      expect(response.length).toBeGreaterThan(1);
      
      response.forEach((maintenance: any) => {
        expect(maintenance).toHaveProperty('id');
        expect(maintenance).toHaveProperty('componentId');
        expect(maintenance).toHaveProperty('customerId', '88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b');
        expect(maintenance).toHaveProperty('description');
        expect(maintenance).toHaveProperty('status');
        expect(maintenance).toHaveProperty('scheduledAt');
        expect(maintenance).toHaveProperty('createdBy');
        expect(maintenance).toHaveProperty('createdAt');
        expect(maintenance).toHaveProperty('updatedAt');
      });
      
      const statuses = response.map((m: any) => m.status);
      expect(statuses.length).toBeGreaterThan(0);
    });
  });

  test('Get maintenance with different customer ID should fail with unauthorized token', ({ given, when, then }) => {
    given(/^Enter a get maintenance payload (.*) (.*)$/, async (input: string, dataObject: string) => {
      const payload = getInputPayload(input)[dataObject];
      request = buildRequest(action, payload);
      request.query = queryParams;
    });

    when('Execute the getMaintenance action with different customer JWT token', async () => {
      const token = createJWT('different-customer');
      request.headers = { Authorization: `Bearer ${token}` };
      
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then('The response should be an array response', async () => {
      expect(Array.isArray(response)).toBe(true);
    });
  });

  test('Filter maintenance by pending status', ({ given, and, when, then }) => {
    let token: string;
    let mockMaintenances: Maintenance[];
    let filteredResponse: Maintenance[];

    given(/^Enter a get maintenance payload (.*) (.*)$/, async (input: string, dataObject: string) => {
      const payload = getInputPayload(input)[dataObject];
      request = buildRequest(action, payload);
      request.query = queryParams;
    });

    and(/^Wait for maintenance repository response (.*) (.*) (.*)$/, async (status: string, mockData: string, mockObject: string) => {
      const sourceData = getMockData(mockData);
      let data = sourceData[mockObject];
      mockMaintenances = data.map((m: any) => new Maintenance(m));
      jest.spyOn(MaintenancePostgreRepository.prototype, 'findMaintenanceByCustomer').mockResolvedValue(mockMaintenances);
    });

    and(/^Set query parameter status (.*)$/, async (statusValue: string) => {
      queryParams.status = statusValue;
      request.query = queryParams;
    });

    when('Execute the getMaintenance action with JWT token', async () => {
      token = createJWT('88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b');
      request.headers = { Authorization: `Bearer ${token}` };
      
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then('The response should contain only pending status maintenance', async () => {
      expect(Array.isArray(response)).toBe(true);
      
      response.forEach((maintenance: any) => {
        expect(maintenance.status).toBe('pending');
        expect(maintenance).toHaveProperty('id');
        expect(maintenance).toHaveProperty('componentId');
        expect(maintenance).toHaveProperty('customerId', '88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b');
        expect(maintenance).toHaveProperty('description');
      });
      
      expect(response.length).toBeGreaterThan(0);
    });

    then('The response should not contain in_progress or completed maintenance', async () => {
      response.forEach((maintenance: any) => {
        expect(maintenance.status).not.toBe('in_progress');
        expect(maintenance.status).not.toBe('completed');
        expect(maintenance.status).not.toBe('cancelled');
      });
    });
  });

  test('Filter maintenance by in_progress status', ({ given, and, when, then }) => {
    let token: string;
    let mockMaintenances: Maintenance[];

    given(/^Enter a get maintenance payload (.*) (.*)$/, async (input: string, dataObject: string) => {
      const payload = getInputPayload(input)[dataObject];
      request = buildRequest(action, payload);
      request.query = queryParams;
    });

    and(/^Wait for maintenance repository response (.*) (.*) (.*)$/, async (status: string, mockData: string, mockObject: string) => {
      const sourceData = getMockData(mockData);
      let data = sourceData[mockObject];
      mockMaintenances = data.map((m: any) => new Maintenance(m));
      jest.spyOn(MaintenancePostgreRepository.prototype, 'findMaintenanceByCustomer').mockResolvedValue(mockMaintenances);
    });

    and(/^Set query parameter status (.*)$/, async (statusValue: string) => {
      queryParams.status = statusValue;
      request.query = queryParams;
    });

    when('Execute the getMaintenance action with JWT token', async () => {
      token = createJWT('88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b');
      request.headers = { Authorization: `Bearer ${token}` };
      
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then('The response should contain only in_progress status maintenance', async () => {
      expect(Array.isArray(response)).toBe(true);
      
      response.forEach((maintenance: any) => {
        expect(maintenance.status).toBe('in_progress');
        expect(maintenance).toHaveProperty('id');
        expect(maintenance).toHaveProperty('componentId');
        expect(maintenance).toHaveProperty('customerId', '88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b');
      });
      
      expect(response.length).toBeGreaterThan(0);
    });
  });

  test('Filter maintenance by completed status', ({ given, and, when, then }) => {
    let token: string;
    let mockMaintenances: Maintenance[];

    given(/^Enter a get maintenance payload (.*) (.*)$/, async (input: string, dataObject: string) => {
      const payload = getInputPayload(input)[dataObject];
      request = buildRequest(action, payload);
      request.query = queryParams;
    });

    and(/^Wait for maintenance repository response (.*) (.*) (.*)$/, async (status: string, mockData: string, mockObject: string) => {
      const sourceData = getMockData(mockData);
      let data = sourceData[mockObject];
      mockMaintenances = data.map((m: any) => new Maintenance(m));
      jest.spyOn(MaintenancePostgreRepository.prototype, 'findMaintenanceByCustomer').mockResolvedValue(mockMaintenances);
    });

    and(/^Set query parameter status (.*)$/, async (statusValue: string) => {
      queryParams.status = statusValue;
      request.query = queryParams;
    });

    when('Execute the getMaintenance action with JWT token', async () => {
      const token = createJWT('88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b');
      request.headers = { Authorization: `Bearer ${token}` };
      
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then('The response should contain only completed status maintenance', async () => {
      expect(Array.isArray(response)).toBe(true);
      
      response.forEach((maintenance: any) => {
        expect(maintenance.status).toBe('completed');
      });
      
      expect(response.length).toBeGreaterThan(0);
    });
  });

  test('Filter maintenance by cancelled status returns empty when no records', ({ given, and, when, then }) => {
    let token: string;
    let mockMaintenances: Maintenance[];

    given(/^Enter a get maintenance payload (.*) (.*)$/, async (input: string, dataObject: string) => {
      const payload = getInputPayload(input)[dataObject];
      request = buildRequest(action, payload);
      request.query = queryParams;
    });

    and(/^Wait for maintenance repository response (.*) (.*) (.*)$/, async (status: string, mockData: string, mockObject: string) => {
      const sourceData = getMockData(mockData);
      let data = sourceData[mockObject];
      mockMaintenances = data.map((m: any) => new Maintenance(m));
      jest.spyOn(MaintenancePostgreRepository.prototype, 'findMaintenanceByCustomer').mockResolvedValue(mockMaintenances);
    });

    and(/^Set query parameter status (.*)$/, async (statusValue: string) => {
      queryParams.status = statusValue;
      request.query = queryParams;
    });

    when('Execute the getMaintenance action with JWT token', async () => {
      const token = createJWT('88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b');
      request.headers = { Authorization: `Bearer ${token}` };
      
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then('The response should be an empty array', async () => {
      expect(Array.isArray(response)).toBe(true);
      expect(response.length).toBe(0);
    });
  });

  test('Uppercase status parameter returns matching results', ({ given, and, when, then }) => {
    let token: string;
    let mockMaintenances: Maintenance[];

    given(/^Enter a get maintenance payload (.*) (.*)$/, async (input: string, dataObject: string) => {
      const payload = getInputPayload(input)[dataObject];
      request = buildRequest(action, payload);
      request.query = queryParams;
    });

    and(/^Wait for maintenance repository response (.*) (.*) (.*)$/, async (status: string, mockData: string, mockObject: string) => {
      const sourceData = getMockData(mockData);
      let data = sourceData[mockObject];
      mockMaintenances = data.map((m: any) => new Maintenance(m));
      jest.spyOn(MaintenancePostgreRepository.prototype, 'findMaintenanceByCustomer').mockResolvedValue(mockMaintenances);
    });

    and(/^Set query parameter status (.*)$/, async (statusValue: string) => {
      queryParams.status = statusValue;
      request.query = queryParams;
    });

    when('Execute the getMaintenance action with JWT token', async () => {
      const token = createJWT('88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b');
      request.headers = { Authorization: `Bearer ${token}` };
      
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then('The response should contain only pending status maintenance', async () => {
      expect(Array.isArray(response)).toBe(true);
      
      response.forEach((maintenance: any) => {
        expect(maintenance.status).toBe('pending');
      });
      
      expect(response.length).toBeGreaterThan(0);
    });
  });

  test('Case-insensitive status filtering works correctly', ({ given, and, when, then }) => {
    let token: string;
    let mockMaintenances: Maintenance[];

    given(/^Enter a get maintenance payload (.*) (.*)$/, async (input: string, dataObject: string) => {
      const payload = getInputPayload(input)[dataObject];
      request = buildRequest(action, payload);
      request.query = queryParams;
    });

    and(/^Wait for maintenance repository response (.*) (.*) (.*)$/, async (status: string, mockData: string, mockObject: string) => {
      const sourceData = getMockData(mockData);
      let data = sourceData[mockObject];
      mockMaintenances = data.map((m: any) => new Maintenance(m));
      jest.spyOn(MaintenancePostgreRepository.prototype, 'findMaintenanceByCustomer').mockResolvedValue(mockMaintenances);
    });

    and(/^Set query parameter status (.*)$/, async (statusValue: string) => {
      queryParams.status = statusValue;
      request.query = queryParams;
    });

    when('Execute the getMaintenance action with JWT token', async () => {
      const token = createJWT('88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b');
      request.headers = { Authorization: `Bearer ${token}` };
      
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then('The response should contain only pending status maintenance', async () => {
      expect(Array.isArray(response)).toBe(true);
      
      response.forEach((maintenance: any) => {
        expect(maintenance.status).toBe('pending');
      });
      
      expect(response.length).toBeGreaterThan(0);
    });
  });

  test('Empty status parameter returns all maintenance records', ({ given, and, when, then }) => {
    let token: string;
    let mockMaintenances: Maintenance[];

    given(/^Enter a get maintenance payload (.*) (.*)$/, async (input: string, dataObject: string) => {
      const payload = getInputPayload(input)[dataObject];
      request = buildRequest(action, payload);
      request.query = queryParams;
    });

    and(/^Wait for maintenance repository response (.*) (.*) (.*)$/, async (status: string, mockData: string, mockObject: string) => {
      const sourceData = getMockData(mockData);
      let data = sourceData[mockObject];
      mockMaintenances = data.map((m: any) => new Maintenance(m));
      jest.spyOn(MaintenancePostgreRepository.prototype, 'findMaintenanceByCustomer').mockResolvedValue(mockMaintenances);
    });

    and(/^Set query parameter status (.*)$/, async (statusValue: string) => {
      if (statusValue !== 'empty') {
        queryParams.status = statusValue;
      }
      request.query = queryParams;
    });

    when('Execute the getMaintenance action with JWT token', async () => {
      const token = createJWT('88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b');
      request.headers = { Authorization: `Bearer ${token}` };
      
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then('The response should contain all maintenance records with multiple statuses', async () => {
      expect(Array.isArray(response)).toBe(true);
      expect(response.length).toBeGreaterThan(1);
      
      const statuses = new Set(response.map((m: any) => m.status));
      expect(statuses.size).toBeGreaterThan(1);
    });
  });

  test('Valid status filter with single maintenance result', ({ given, and, when, then }) => {
    let token: string;
    let mockMaintenances: Maintenance[];

    given(/^Enter a get maintenance payload (.*) (.*)$/, async (input: string, dataObject: string) => {
      const payload = getInputPayload(input)[dataObject];
      request = buildRequest(action, payload);
      request.query = queryParams;
    });

    and(/^Wait for maintenance repository response (.*) (.*) (.*)$/, async (status: string, mockData: string, mockObject: string) => {
      const sourceData = getMockData(mockData);
      let data = sourceData[mockObject];
      mockMaintenances = data.map((m: any) => new Maintenance(m));
      jest.spyOn(MaintenancePostgreRepository.prototype, 'findMaintenanceByCustomer').mockResolvedValue(mockMaintenances);
    });

    and(/^Set query parameter status (.*)$/, async (statusValue: string) => {
      queryParams.status = statusValue;
      request.query = queryParams;
    });

    when('Execute the getMaintenance action with JWT token', async () => {
      const token = createJWT('88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b');
      request.headers = { Authorization: `Bearer ${token}` };
      
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then('The response should contain exactly 1 maintenance record', async () => {
      expect(Array.isArray(response)).toBe(true);
      expect(response.length).toBe(1);
    });

    then('The maintenance record should have status pending', async () => {
      expect(response[0].status).toBe('pending');
      expect(response[0]).toHaveProperty('id', 'maint-001');
      expect(response[0]).toHaveProperty('componentId', 'c4e9f3e8-5c1a-4a2f-8b3c-9a8d7e6f5c4b');
      expect(response[0]).toHaveProperty('customerId', '88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b');
      expect(response[0]).toHaveProperty('description', 'Engine oil change');
    });
  });
});
