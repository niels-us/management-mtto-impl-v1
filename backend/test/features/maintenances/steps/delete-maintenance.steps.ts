import { defineFeature, loadFeature } from 'jest-cucumber';
import { handler } from '../../../../src/maintenances/infrastructure/bootstrap/App';
import { MaintenanceDynamoRepository } from '../../../../src/maintenances/infrastructure/repository/MaintenanceDynamoRepository';
import * as jwt from 'jsonwebtoken';
import { Maintenance } from '../../../../src/maintenances/domain/entities/Maintenance';
import { buildRequest, getInputPayload } from '../util/AwsTestHelper';
import * as path from 'path';

const feature = loadFeature(path.join(__dirname, '../delete-maintenance.feature'));

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
  return jwt.sign(
    { sub: '550e8400-e29b-41d4-a716-446655440000', username: 'tester', customerId },
    secret,
    {
      expiresIn: '8h',
      algorithm: 'HS256',
      audience: process.env.JWT_AUDIENCE || 'maintenance-api',
      issuer: process.env.JWT_ISSUER || 'maintenance-api'
    }
  );
};

const existingMaintenance = new Maintenance({
  id: 'a9b8c7d6-e5f4-4c3b-8a97-6e5f4d3c2b1a',
  componentId: 'c4e9f3e8-5c1a-4a2f-8b3c-9a8d7e6f5c4b',
  customerId: '88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b',
  description: 'Engine oil change',
  scheduledAt: new Date('2026-04-15T10:00:00Z'),
  createdBy: '550e8400-e29b-41d4-a716-446655440000',
  status: 'pending',
  createdAt: new Date(),
  updatedAt: new Date()
});

defineFeature(feature, (test) => {
  let request: any;
  let response: any;
  const action = 'deleteMaintenance';

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-key-for-unit-tests-min-32';
    process.env.JWT_AUDIENCE = 'maintenance-api';
    process.env.JWT_ISSUER = 'maintenance-api';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── SUCCESS ──────────────────────────────────────────────────────────────

  test('Success - Existing maintenance is deleted', ({ given, and, when, then }) => {
    given(/^Enter a delete maintenance payload (.*) (.*)$/, (input: string, dataObject: string) => {
      const payload = getInputPayload(input)[dataObject];
      request = buildRequest(action, payload);
    });

    and('The maintenance repository has the maintenance record', () => {
      jest.spyOn(MaintenanceDynamoRepository.prototype, 'findMaintenanceById').mockResolvedValue(existingMaintenance);
      jest.spyOn(MaintenanceDynamoRepository.prototype, 'deleteMaintenance').mockResolvedValue(true);
    });

    when('Execute the deleteMaintenance action with JWT token', async () => {
      request.headers = { Authorization: `Bearer ${createJWT()}` };
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then(/^The response should confirm deletion with message "(.+)"$/, (expectedMessage: string) => {
      expect(response).toBeDefined();
      expect(response).not.toBeInstanceOf(Error);
      expect(response.message).toEqual(expectedMessage);
      expect(response.id).toEqual('a9b8c7d6-e5f4-4c3b-8a97-6e5f4d3c2b1a');
    });
  });

  // ─── NO AUTH ──────────────────────────────────────────────────────────────

  test('Unauthorized - Missing authentication header returns error', ({ given, when, then }) => {
    given(/^Enter a delete maintenance payload (.*) (.*)$/, (input: string, dataObject: string) => {
      const payload = getInputPayload(input)[dataObject];
      request = buildRequest(action, payload);
    });

    when('Execute the deleteMaintenance action without JWT token', async () => {
      // No Authorization header
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then(/^The response should be an authentication error with message "(.+)"$/, (expectedMessage: string) => {
      if (response instanceof Error) {
        expect(response.message).toEqual(expectedMessage);
      } else if (response && response.message) {
        expect(response.message).toEqual(expectedMessage);
      } else {
        fail('Expected error response but got: ' + JSON.stringify(response));
      }
    });
  });

  // ─── INVALID TOKEN ────────────────────────────────────────────────────────

  test('Invalid JWT token returns unauthorized error', ({ given, when, then }) => {
    given(/^Enter a delete maintenance payload (.*) (.*)$/, (input: string, dataObject: string) => {
      const payload = getInputPayload(input)[dataObject];
      request = buildRequest(action, payload);
    });

    when('Execute the deleteMaintenance action with invalid JWT token', async () => {
      request.headers = { Authorization: 'Bearer invalid.token.here' };
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then(/^The response should be an authentication error with message "(.+)"$/, (expectedMessage: string) => {
      if (response instanceof Error) {
        expect(response.message).toEqual(expectedMessage);
      } else if (response && response.message) {
        expect(response.message).toEqual(expectedMessage);
      } else {
        fail('Expected error response but got: ' + JSON.stringify(response));
      }
    });
  });

  // ─── NOT FOUND ────────────────────────────────────────────────────────────

  test('Not found - Non-existent maintenance returns error', ({ given, and, when, then }) => {
    given(/^Enter a delete maintenance payload (.*) (.*)$/, (input: string, dataObject: string) => {
      const payload = getInputPayload(input)[dataObject];
      request = buildRequest(action, payload);
    });

    and('The maintenance repository returns no record', () => {
      jest.spyOn(MaintenanceDynamoRepository.prototype, 'findMaintenanceById').mockResolvedValue(null);
    });

    when('Execute the deleteMaintenance action with JWT token', async () => {
      request.headers = { Authorization: `Bearer ${createJWT()}` };
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then(/^The response should be a not found error with message "(.+)"$/, (expectedMessage: string) => {
      if (response instanceof Error) {
        expect(response.message).toEqual(expectedMessage);
      } else if (response && response.message) {
        expect(response.message).toEqual(expectedMessage);
      } else {
        fail('Expected error response but got: ' + JSON.stringify(response));
      }
    });
  });

  // ─── INVALID UUID ─────────────────────────────────────────────────────────

  test('Bad request - Invalid UUID format returns error', ({ given, when, then }) => {
    given(/^Enter a delete maintenance payload (.*) (.*)$/, (input: string, dataObject: string) => {
      const payload = getInputPayload(input)[dataObject];
      request = buildRequest(action, payload);
    });

    when('Execute the deleteMaintenance action with JWT token', async () => {
      request.headers = { Authorization: `Bearer ${createJWT()}` };
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then(/^The response should be a validation error with message "(.+)"$/, (expectedMessage: string) => {
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
