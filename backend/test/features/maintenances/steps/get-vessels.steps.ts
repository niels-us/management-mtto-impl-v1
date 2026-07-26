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
import { Vessel } from '../../../../src/maintenances/domain/entities/Vessel';
import * as path from 'path';

const feature = loadFeature(path.join(__dirname, '../get-vessels.feature'));

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
  let action: string = 'getVessels';

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-key-for-unit-tests-min-32';
    process.env.JWT_AUDIENCE = 'maintenance-api';
    process.env.JWT_ISSUER = 'maintenance-api';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('Executing get vessels service with valid authentication', ({ given, and, when, then }) => {
    let token: string;
    let mockVessels: Vessel[];

    given(/^Enter a get vessels payload (.*) (.*)$/, async (input: string, dataObject: string) => {
      const payload = getInputPayload(input)[dataObject];
      request = buildRequest(action, payload);
    });

    and(/^Wait for vessel repository response (.*) (.*) (.*)$/, async (status: string, mockData: string, mockObject: string) => {
      const data = getMockData(mockData)[mockObject];
      mockVessels = data.map((v: any) => new Vessel(v));
      jest.spyOn(MaintenancePostgreRepository.prototype, 'findAllByCustomer').mockResolvedValue(mockVessels);
    });

    when('Execute the getVessels action with JWT token', async () => {
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
      
      // Response should be an array of vessels
      expect(Array.isArray(response)).toBe(true);
      expect(response).toEqual(expectedResponse);
    });
  });

  test('Unauthorized - Missing authentication header returns 401', ({ given, when, then }) => {
    given(/^Enter a get vessels payload (.*) (.*)$/, async (input: string, dataObject: string) => {
      const payload = getInputPayload(input)[dataObject];
      request = buildRequest(action, payload);
    });

    when('Execute the getVessels action without JWT token', async () => {
      request.headers = {}; // No Authorization header
      
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then(/^The response should be an authentication error with message "(.+)"$/, async (expectedMessage: string) => {
      const expectedError = getExpectedErrorResponse('vessels-error')['no_auth'];
      
      // Check if error message matches
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

    given(/^Enter a get vessels payload (.*) (.*)$/, async (input: string, dataObject: string) => {
      const payload = getInputPayload(input)[dataObject];
      request = buildRequest(action, payload);
    });

    when('Execute the getVessels action with invalid JWT token', async () => {
      request.headers = { Authorization: 'Bearer invalid.token.here' };
      
      // Suppress NestJS logger output for expected JWT validation failures
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
      // With invalid token, handler won't set user, so getVessels should throw
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
