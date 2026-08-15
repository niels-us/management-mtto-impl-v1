import { defineFeature, loadFeature } from 'jest-cucumber';
import { handler } from '../../../../src/maintenances/infrastructure/bootstrap/App';
import { MaintenanceDynamoRepository } from '../../../../src/maintenances/infrastructure/repository/MaintenanceDynamoRepository';
import * as bcrypt from 'bcrypt';
import {
  buildRequest,
  getExpectedErrorResponse,
  getExpectedResponse,
  getInputPayload,
  getMockData,
  IRequest
} from '../util/AwsTestHelper';
import { User } from '../../../../src/maintenances/domain/entities/User';
import * as path from 'path';

jest.mock('bcrypt');

const feature = loadFeature(path.join(__dirname, '../auth-login.feature'));

defineFeature(feature, (test) => {
  let request: IRequest;
  let response: any;
  let action: string = 'login';

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-key-for-unit-tests-min-32';
  });

  afterEach(() => {
      jest.clearAllMocks();
  });

  test('Executing login service', ({ given, and, when, then }) => {
    given(/^Enter a login payload (.*) (.*)$/, async (input: string, dataObject: string) => {
      const payload = getInputPayload(input)[dataObject];
      request = buildRequest(action, payload);
      
      // Setup bcrypt.compare mock based on password
      if (payload.payload.password === 'correctPassword') {
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      } else {
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      }
    });

    and(/^Wait for user repository response (.*) (.*) (.*)$/, async (status: string, mockData: string, mockObject: string) => {
      const data = getMockData(mockData)[mockObject];
      if (data) {
        jest.spyOn(MaintenanceDynamoRepository.prototype, 'findByUsername').mockResolvedValue(new User(data));
      } else {
        jest.spyOn(MaintenanceDynamoRepository.prototype, 'findByUsername').mockResolvedValue(null);
      }
    });

    when('Execute the login action', async () => {
      try {
        response = await (handler as any)(request, {
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
      } catch (error) {
        response = error;
      }
    });

    then(/^The response will be displayed (.*) (.*) (.*)$/, async (status: string, result: string, dataObject: string) => {
      if (status === 'ok') {
        expect(response).toHaveProperty('token');
      } else {
        const expectedResponse = getExpectedErrorResponse(result)[dataObject];
        expect(response.message).toEqual(expectedResponse.message);
      }
    });
  });

  test('Bad request - Missing fields returns validation error', ({ given, when, then }) => {
    given(/^Enter a login payload (.*) (.*)$/, async (input: string, dataObject: string) => {
      const payload = getInputPayload(input)[dataObject];
      request = buildRequest(action, payload);
    });

    when('Execute the login action', async () => {
      try {
        response = await (handler as any)(request, {
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
      } catch (error) {
        response = error;
      }
    });

    then(/^The response will be displayed with errors (.*) (.*)$/, async (result: string, dataObject: string) => {
      const expectedResponse = getExpectedErrorResponse(result)[dataObject];
      const message = Array.isArray(expectedResponse) ? expectedResponse[0] : expectedResponse.message;
      
      if (response.response && response.response.message) {
          expect(response.response.message).toEqual(message);
      } else {
          expect(response.message).toEqual(message);
      }
    });
  });
});
