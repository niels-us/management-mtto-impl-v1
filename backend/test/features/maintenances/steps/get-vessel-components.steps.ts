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
  getMockData,
  IRequest
} from '../util/AwsTestHelper';
import { Component } from '../../../../src/maintenances/domain/entities/Component';
import { Vessel } from '../../../../src/maintenances/domain/entities/Vessel';
import * as path from 'path';

const feature = loadFeature(path.join(__dirname, '../get-vessel-components.feature'));

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
  let action: string = 'getVesselComponents';
  let vesselId: string;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-key-for-unit-tests-min-32';
    process.env.JWT_AUDIENCE = 'maintenance-api';
    process.env.JWT_ISSUER = 'maintenance-api';
  });

  afterEach(() => {
    jest.clearAllMocks();
    vesselId = '';
  });

  test('Executing get vessel components service with valid authentication', ({ given, and, when, then }) => {
    let token: string;
    let mockComponents: Component[];
    let mockVessel: Vessel;

    given(/^Enter a get vessel components payload (.*) (.*)$/, async (input: string, dataObject: string) => {
      const payload = getInputPayload(input)[dataObject];
      request = buildRequest(action, payload);
    });

    and(/^Set vessel path parameter (.*)$/, async (pathVesselId: string) => {
      vesselId = pathVesselId;
      request.path = { id: vesselId };
    });

    and(/^Wait for component repository response (.*) (.*) (.*)$/, async (status: string, mockData: string, mockObject: string) => {
      const sourceData = getMockData(mockData);
      let componentData = sourceData[mockObject];
      
      // Mock the vessel
      mockVessel = new Vessel({
        id: vesselId,
        name: 'Test Vessel',
        registrationNumber: 'REG-001',
        customerId: '88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b',
        createdAt: new Date()
      });
      
      if (Array.isArray(componentData)) {
        mockComponents = componentData.map((c: any) => new Component(c));
      } else if (componentData === null || componentData === undefined) {
        mockComponents = [];
      } else {
        mockComponents = [new Component(componentData)];
      }
      
      jest.spyOn(MaintenanceDynamoRepository.prototype, 'findVesselById').mockResolvedValue(mockVessel);
      jest.spyOn(MaintenanceDynamoRepository.prototype, 'findAllByVessel').mockResolvedValue(mockComponents);
    });

    when('Execute the getVesselComponents action with JWT token', async () => {
      token = createJWT('88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b');
      request.headers = { Authorization: `Bearer ${token}` };
      
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then(/^The response will display components (.*) (.*)$/, async (result: string, dataObject: string) => {
      const expectedResponse = getExpectedResponse(result)[dataObject];
      
      expect(Array.isArray(response)).toBe(true);
      
      if (Array.isArray(expectedResponse) && expectedResponse.length > 0) {
        expect(response.length).toBeGreaterThan(0);
        expect(response[0]).toHaveProperty('id');
        expect(response[0]).toHaveProperty('name');
        expect(response[0]).toHaveProperty('vesselId');
        expect(response[0]).toHaveProperty('serialNumber');
      } else if (Array.isArray(expectedResponse) && expectedResponse.length === 0) {
        expect(response.length).toBe(0);
      }
    });
  });

  test('Unauthorized - Missing authentication header returns 401', ({ given, and, when, then }) => {
    given(/^Enter a get vessel components payload (.*) (.*)$/, async (input: string, dataObject: string) => {
      const payload = getInputPayload(input)[dataObject];
      request = buildRequest(action, payload);
    });

    and(/^Set vessel path parameter (.*)$/, async (pathVesselId: string) => {
      vesselId = pathVesselId;
      request.path = { id: vesselId };
    });

    when('Execute the getVesselComponents action without JWT token', async () => {
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

  test('Invalid JWT token returns unauthorized error', ({ given, and, when, then }) => {
    let loggerErrorSpy: jest.SpyInstance;

    given(/^Enter a get vessel components payload (.*) (.*)$/, async (input: string, dataObject: string) => {
      const payload = getInputPayload(input)[dataObject];
      request = buildRequest(action, payload);
    });

    and(/^Set vessel path parameter (.*)$/, async (pathVesselId: string) => {
      vesselId = pathVesselId;
      request.path = { id: vesselId };
    });

    when('Execute the getVesselComponents action with invalid JWT token', async () => {
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

  test('Successfully get multiple components for a vessel', ({ given, and, when, then }) => {
    let token: string;
    let mockComponents: Component[];
    let mockVessel: Vessel;

    given(/^Enter a get vessel components payload (.*) (.*)$/, async (input: string, dataObject: string) => {
      const payload = getInputPayload(input)[dataObject];
      request = buildRequest(action, payload);
    });

    and(/^Set vessel path parameter (.*)$/, async (pathVesselId: string) => {
      vesselId = pathVesselId;
      request.path = { id: vesselId };
    });

    and(/^Wait for component repository response (.*) (.*) (.*)$/, async (status: string, mockData: string, mockObject: string) => {
      const sourceData = getMockData(mockData);
      let data = sourceData[mockObject];
      mockComponents = data.map((c: any) => new Component(c));
      mockVessel = new Vessel({
        id: vesselId,
        name: 'Test Vessel',
        registrationNumber: 'REG-001',
        customerId: '88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b',
        createdAt: new Date()
      });
      jest.spyOn(MaintenanceDynamoRepository.prototype, 'findVesselById').mockResolvedValue(mockVessel);
      jest.spyOn(MaintenanceDynamoRepository.prototype, 'findAllByVessel').mockResolvedValue(mockComponents);
    });

    when('Execute the getVesselComponents action with JWT token', async () => {
      token = createJWT('88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b');
      request.headers = { Authorization: `Bearer ${token}` };
      
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then(/^The response should contain components list (.*)$/, async (dataObject: string) => {
      expect(Array.isArray(response)).toBe(true);
      expect(response.length).toBeGreaterThan(1);
      
      response.forEach((component: any) => {
        expect(component).toHaveProperty('id');
        expect(component).toHaveProperty('name');
        expect(component).toHaveProperty('vesselId', '061658b9-bf29-4e88-b0ec-c92ff540ac99');
        expect(component).toHaveProperty('customerId', '88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b');
        expect(component).toHaveProperty('serialNumber');
        expect(component).toHaveProperty('installedAt');
      });
      
      const names = response.map((c: any) => c.name);
      expect(names.length).toBeGreaterThan(0);
    });
  });

  test('Get vessel components with different vessel ID uses correct path parameter', ({ given, and, when, then }) => {
    let token: string;
    let mockComponents: Component[];
    let mockVessel: Vessel;

    given(/^Enter a get vessel components payload (.*) (.*)$/, async (input: string, dataObject: string) => {
      const payload = getInputPayload(input)[dataObject];
      request = buildRequest(action, payload);
    });

    and(/^Set vessel path parameter (.*)$/, async (pathVesselId: string) => {
      vesselId = pathVesselId;
      request.path = { id: vesselId };
      expect(vesselId).toBe('d6c5b4a3-f2e1-4d9c-8b7a-6f5e4d3c2b1a');
    });

    and(/^Wait for component repository response (.*) (.*) (.*)$/, async (status: string, mockData: string, mockObject: string) => {
      const sourceData = getMockData(mockData);
      let data = sourceData[mockObject];
      mockComponents = data.map((c: any) => new Component(c));
      mockVessel = new Vessel({
        id: vesselId,
        name: 'Test Vessel 002',
        registrationNumber: 'REG-002',
        customerId: '88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b',
        createdAt: new Date()
      });
      jest.spyOn(MaintenanceDynamoRepository.prototype, 'findVesselById').mockResolvedValue(mockVessel);
      jest.spyOn(MaintenanceDynamoRepository.prototype, 'findAllByVessel').mockResolvedValue(mockComponents);
    });

    when('Execute the getVesselComponents action with JWT token', async () => {
      token = createJWT('88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b');
      request.headers = { Authorization: `Bearer ${token}` };
      
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then('The response should contain correct vessel components', async () => {
      expect(Array.isArray(response)).toBe(true);
      response.forEach((component: any) => {
        expect(component.vesselId).toBe('d6c5b4a3-f2e1-4d9c-8b7a-6f5e4d3c2b1a');
      });
    });
  });

  test('Get vessel components when no components exist for vessel', ({ given, and, when, then }) => {
    let token: string;
    let mockComponents: Component[];
    let mockVessel: Vessel;

    given(/^Enter a get vessel components payload (.*) (.*)$/, async (input: string, dataObject: string) => {
      const payload = getInputPayload(input)[dataObject];
      request = buildRequest(action, payload);
    });

    and(/^Set vessel path parameter (.*)$/, async (pathVesselId: string) => {
      vesselId = pathVesselId;
      request.path = { id: vesselId };
    });

    and(/^Wait for component repository response (.*) (.*) (.*)$/, async (status: string, mockData: string, mockObject: string) => {
      const sourceData = getMockData(mockData);
      let data = sourceData[mockObject];
      mockComponents = data.map((c: any) => new Component(c));
      mockVessel = new Vessel({
        id: vesselId,
        name: 'Test Vessel',
        registrationNumber: 'REG-001',
        customerId: '88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b',
        createdAt: new Date()
      });
      jest.spyOn(MaintenanceDynamoRepository.prototype, 'findVesselById').mockResolvedValue(mockVessel);
      jest.spyOn(MaintenanceDynamoRepository.prototype, 'findAllByVessel').mockResolvedValue(mockComponents);
    });

    when('Execute the getVesselComponents action with JWT token', async () => {
      token = createJWT('88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b');
      request.headers = { Authorization: `Bearer ${token}` };
      
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then('The response should be an empty components array', async () => {
      expect(Array.isArray(response)).toBe(true);
      expect(response.length).toBe(0);
    });
  });

  test('Get vessel components with valid tenant validation', ({ given, and, when, then }) => {
    let token: string;
    let mockComponents: Component[];
    let mockVessel: Vessel;

    given(/^Enter a get vessel components payload (.*) (.*)$/, async (input: string, dataObject: string) => {
      const payload = getInputPayload(input)[dataObject];
      request = buildRequest(action, payload);
    });

    and(/^Set vessel path parameter (.*)$/, async (pathVesselId: string) => {
      vesselId = pathVesselId;
      request.path = { id: vesselId };
    });

    and(/^Wait for component repository response (.*) (.*) (.*)$/, async (status: string, mockData: string, mockObject: string) => {
      const sourceData = getMockData(mockData);
      let data = sourceData[mockObject];
      mockComponents = data.map((c: any) => new Component(c));
      mockVessel = new Vessel({
        id: vesselId,
        name: 'Test Vessel',
        registrationNumber: 'REG-001',
        customerId: '88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b',
        createdAt: new Date()
      });
      jest.spyOn(MaintenanceDynamoRepository.prototype, 'findVesselById').mockResolvedValue(mockVessel);
      jest.spyOn(MaintenanceDynamoRepository.prototype, 'findAllByVessel').mockResolvedValue(mockComponents);
    });

    when('Execute the getVesselComponents action with JWT token', async () => {
      token = createJWT('88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b');
      request.headers = { Authorization: `Bearer ${token}` };
      
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then('Each component should have customerId matching authenticated user', async () => {
      expect(Array.isArray(response)).toBe(true);
      response.forEach((component: any) => {
        expect(component.customerId).toBe('88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b');
      });
    });
  });

  test('Get vessel components with different customer should not return cross-tenant data', ({ given, and, when, then }) => {
    let mockComponents: Component[];
    let mockVessel: Vessel;

    given(/^Enter a get vessel components payload (.*) (.*)$/, async (input: string, dataObject: string) => {
      const payload = getInputPayload(input)[dataObject];
      request = buildRequest(action, payload);
    });

    and(/^Set vessel path parameter (.*)$/, async (pathVesselId: string) => {
      vesselId = pathVesselId;
      request.path = { id: vesselId };
    });

    and(/^Wait for component repository response (.*) (.*) (.*)$/, async (status: string, mockData: string, mockObject: string) => {
      const sourceData = getMockData(mockData);
      let data = sourceData[mockObject];
      mockComponents = data.map((c: any) => new Component(c));
      mockVessel = new Vessel({
        id: vesselId,
        name: 'Test Vessel',
        registrationNumber: 'REG-001',
        customerId: 'different-customer',
        createdAt: new Date()
      });
      jest.spyOn(MaintenanceDynamoRepository.prototype, 'findVesselById').mockResolvedValue(mockVessel);
      jest.spyOn(MaintenanceDynamoRepository.prototype, 'findAllByVessel').mockResolvedValue(mockComponents);
    });

    when('Execute the getVesselComponents action with different customer JWT token', async () => {
      const token = createJWT('different-customer');
      request.headers = { Authorization: `Bearer ${token}` };
      
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then('The response should be an empty components array', async () => {
      expect(Array.isArray(response)).toBe(true);
      expect(response.length).toBe(0);
    });
  });

  test('Get vessel components returns all required fields', ({ given, and, when, then }) => {
    let token: string;
    let mockComponents: Component[];
    let mockVessel: Vessel;

    given(/^Enter a get vessel components payload (.*) (.*)$/, async (input: string, dataObject: string) => {
      const payload = getInputPayload(input)[dataObject];
      request = buildRequest(action, payload);
    });

    and(/^Set vessel path parameter (.*)$/, async (pathVesselId: string) => {
      vesselId = pathVesselId;
      request.path = { id: vesselId };
    });

    and(/^Wait for component repository response (.*) (.*) (.*)$/, async (status: string, mockData: string, mockObject: string) => {
      const sourceData = getMockData(mockData);
      let data = sourceData[mockObject];
      mockComponents = data.map((c: any) => new Component(c));
      mockVessel = new Vessel({
        id: vesselId,
        name: 'Test Vessel',
        registrationNumber: 'REG-001',
        customerId: '88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b',
        createdAt: new Date()
      });
      jest.spyOn(MaintenanceDynamoRepository.prototype, 'findVesselById').mockResolvedValue(mockVessel);
      jest.spyOn(MaintenanceDynamoRepository.prototype, 'findAllByVessel').mockResolvedValue(mockComponents);
    });

    when('Execute the getVesselComponents action with JWT token', async () => {
      token = createJWT('88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b');
      request.headers = { Authorization: `Bearer ${token}` };
      
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then('Each component record should have id, name, vesselId, customerId, serialNumber, installedAt', async () => {
      expect(Array.isArray(response)).toBe(true);
      response.forEach((component: any) => {
        expect(component).toHaveProperty('id');
        expect(component).toHaveProperty('name');
        expect(component).toHaveProperty('vesselId');
        expect(component).toHaveProperty('customerId');
        expect(component).toHaveProperty('serialNumber');
        expect(component).toHaveProperty('installedAt');
      });
    });
  });

  test('Get vessel components with invalid vessel ID returns empty array', ({ given, and, when, then }) => {
    let token: string;
    let mockComponents: Component[];
    let mockVessel: Vessel;

    given(/^Enter a get vessel components payload (.*) (.*)$/, async (input: string, dataObject: string) => {
      const payload = getInputPayload(input)[dataObject];
      request = buildRequest(action, payload);
    });

    and(/^Set vessel path parameter (.*)$/, async (pathVesselId: string) => {
      vesselId = pathVesselId;
      request.path = { id: vesselId };
    });

    and(/^Wait for component repository response (.*) (.*) (.*)$/, async (status: string, mockData: string, mockObject: string) => {
      const sourceData = getMockData(mockData);
      let data = sourceData[mockObject];
      mockComponents = data.map((c: any) => new Component(c));
      mockVessel = new Vessel({
        id: vesselId,
        name: 'Test Vessel',
        registrationNumber: 'REG-001',
        customerId: '88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b',
        createdAt: new Date()
      });
      jest.spyOn(MaintenanceDynamoRepository.prototype, 'findVesselById').mockResolvedValue(mockVessel);
      jest.spyOn(MaintenanceDynamoRepository.prototype, 'findAllByVessel').mockResolvedValue(mockComponents);
    });

    when('Execute the getVesselComponents action with JWT token', async () => {
      token = createJWT('88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b');
      request.headers = { Authorization: `Bearer ${token}` };
      
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then('The response should be an empty components array', async () => {
      expect(Array.isArray(response)).toBe(true);
      expect(response.length).toBe(0);
    });
  });

  test('Get vessel components validates tenant middleware protection', ({ given, and, when, then }) => {
    let token: string;
    let mockComponents: Component[];
    let mockVessel: Vessel;

    given(/^Enter a get vessel components payload (.*) (.*)$/, async (input: string, dataObject: string) => {
      const payload = getInputPayload(input)[dataObject];
      request = buildRequest(action, payload);
    });

    and(/^Set vessel path parameter (.*)$/, async (pathVesselId: string) => {
      vesselId = pathVesselId;
      request.path = { id: vesselId };
    });

    and(/^Wait for component repository response (.*) (.*) (.*)$/, async (status: string, mockData: string, mockObject: string) => {
      const sourceData = getMockData(mockData);
      let data = sourceData[mockObject];
      mockComponents = data.map((c: any) => new Component(c));
      mockVessel = new Vessel({
        id: vesselId,
        name: 'Test Vessel',
        registrationNumber: 'REG-001',
        customerId: '88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b',
        createdAt: new Date()
      });
      jest.spyOn(MaintenanceDynamoRepository.prototype, 'findVesselById').mockResolvedValue(mockVessel);
      jest.spyOn(MaintenanceDynamoRepository.prototype, 'findAllByVessel').mockResolvedValue(mockComponents);
    });

    when('Execute the getVesselComponents action with JWT token', async () => {
      token = createJWT('88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b');
      request.headers = { Authorization: `Bearer ${token}` };
      
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then('The response verify tenant middleware applied correctly', async () => {
      expect(Array.isArray(response)).toBe(true);
      if (response.length > 0) {
        response.forEach((component: any) => {
          expect(component.customerId).toBe('88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b');
          expect(component.vesselId).toBe('061658b9-bf29-4e88-b0ec-c92ff540ac99');
        });
      }
    });
  });

  test('Get vessel components with single result validation', ({ given, and, when, then }) => {
    let token: string;
    let mockComponents: Component[];
    let mockVessel: Vessel;

    given(/^Enter a get vessel components payload (.*) (.*)$/, async (input: string, dataObject: string) => {
      const payload = getInputPayload(input)[dataObject];
      request = buildRequest(action, payload);
    });

    and(/^Set vessel path parameter (.*)$/, async (pathVesselId: string) => {
      vesselId = pathVesselId;
      request.path = { id: vesselId };
    });

    and(/^Wait for component repository response (.*) (.*) (.*)$/, async (status: string, mockData: string, mockObject: string) => {
      const sourceData = getMockData(mockData);
      let data = sourceData[mockObject];
      mockComponents = data.map((c: any) => new Component(c));
      mockVessel = new Vessel({
        id: vesselId,
        name: 'Test Vessel',
        registrationNumber: 'REG-001',
        customerId: '88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b',
        createdAt: new Date()
      });
      jest.spyOn(MaintenanceDynamoRepository.prototype, 'findVesselById').mockResolvedValue(mockVessel);
      jest.spyOn(MaintenanceDynamoRepository.prototype, 'findAllByVessel').mockResolvedValue(mockComponents);
    });

    when('Execute the getVesselComponents action with JWT token', async () => {
      token = createJWT('88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b');
      request.headers = { Authorization: `Bearer ${token}` };
      
      try {
        response = await (handler as any)(request, createLambdaContext());
      } catch (error) {
        response = error;
      }
    });

    then('The response should contain exactly 1 component record', async () => {
      expect(Array.isArray(response)).toBe(true);
      expect(response.length).toBe(1);
    });

    then('The component should have name and serialNumber populated', async () => {
      expect(response[0]).toHaveProperty('name');
      expect(response[0]).toHaveProperty('serialNumber');
      expect(response[0].name).not.toBeNull();
      expect(response[0].name).not.toBe('');
      expect(response[0].serialNumber).not.toBeNull();
      expect(response[0].serialNumber).not.toBe('');
    });
  });
});
