import { CreateTableCommand, DynamoDBClient, waitUntilTableExists } from '@aws-sdk/client-dynamodb';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBConnection } from '../src/common/db/methods/DynamoDBConnection.js';
import { DynamoItemMapper } from '../src/maintenances/infrastructure/repository/DynamoItemMapper.js';
import { Customer } from '../src/maintenances/domain/entities/Customer.js';
import { User } from '../src/maintenances/domain/entities/User.js';
import { Vessel } from '../src/maintenances/domain/entities/Vessel.js';
import { Component } from '../src/maintenances/domain/entities/Component.js';
import { Maintenance } from '../src/maintenances/domain/entities/Maintenance.js';

const IDS = {
  customer1: '88c23e8f-b0a4-4d5e-a8c1-8e4c5e6d7a8b',
  customer2: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  customer3: 'f2a3b4c5-d6e7-4f8a-9b0c-1d2e3f4a5b6c',
  user1: '550e8400-e29b-41d4-a716-446655440000',
  user2: '660f9501-f3ac-42e5-b827-557766550111',
  user3: '7710a612-04bd-43f6-a938-668877660222',
  vessel1: '8b9c0d1e-2f3a-4b5c-8d7e-8f901a2b3c4d',
  vessel2: '9c0d1e2f-3a4b-4c5d-8e7f-901a2b3c4d5e',
  vessel3: '0d1e2f3a-4b5c-4d6e-8f80-1a2b3c4d5e6f',
  component1: '1e2f3a4b-5c6d-4e7f-8091-a2b3c4d5e6f7',
  component2: '2f3a4b5c-6d7e-4f80-91a2-b3c4d5e6f708',
  component3: '30a4b5c6-d7e8-4f91-a2b3-c4d5e6f70819',
  maintenance1: '41b5c6d7-e8f9-40a2-b3c4-d5e6f708192a',
  maintenance2: '52c6d7e8-f90a-41b3-94d5-e6f708192a3b',
  maintenance3: '63d7e8f9-0a1b-42c4-85e6-f708192a3b4c',
};

const HASHES = {
  user1: '$2b$10$mPp5vjbgOo9CkmUmYdKQJehKKcVMdAPI865hrLLDN.UVviXigSjte',
  user2: '$2b$10$pg4l/vIP0SdwhReyxxcPGeJvz.nHt0zK/MmR5B2KRUvOh1arNMxqW',
  user3: '$2b$10$LBLvylBn8wcyMsYgZO15X.Q8mQdJb30MxJli6wvc7h1wQxqM05XLm',
};

const dayOffset = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const ensureTable = async (): Promise<void> => {
  const tableName = DynamoDBConnection.getTableName();
  const region = process.env.REGION || process.env.AWS_REGION || 'us-east-1';
  const endpoint = process.env.DYNAMODB_ENDPOINT || undefined;
  const client = new DynamoDBClient({ region, endpoint });

  try {
    await client.send(
      new CreateTableCommand({
        TableName: tableName,
        BillingMode: 'PAY_PER_REQUEST',
        AttributeDefinitions: [
          { AttributeName: 'PK', AttributeType: 'S' },
          { AttributeName: 'SK', AttributeType: 'S' },
          { AttributeName: 'GSI1PK', AttributeType: 'S' },
          { AttributeName: 'GSI1SK', AttributeType: 'S' },
          { AttributeName: 'GSI2PK', AttributeType: 'S' },
          { AttributeName: 'GSI2SK', AttributeType: 'S' },
          { AttributeName: 'GSI3PK', AttributeType: 'S' },
          { AttributeName: 'GSI3SK', AttributeType: 'S' },
        ],
        KeySchema: [
          { AttributeName: 'PK', KeyType: 'HASH' },
          { AttributeName: 'SK', KeyType: 'RANGE' },
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'GSI1',
            KeySchema: [
              { AttributeName: 'GSI1PK', KeyType: 'HASH' },
              { AttributeName: 'GSI1SK', KeyType: 'RANGE' },
            ],
            Projection: { ProjectionType: 'ALL' },
          },
          {
            IndexName: 'GSI2',
            KeySchema: [
              { AttributeName: 'GSI2PK', KeyType: 'HASH' },
              { AttributeName: 'GSI2SK', KeyType: 'RANGE' },
            ],
            Projection: { ProjectionType: 'ALL' },
          },
          {
            IndexName: 'GSI3',
            KeySchema: [
              { AttributeName: 'GSI3PK', KeyType: 'HASH' },
              { AttributeName: 'GSI3SK', KeyType: 'RANGE' },
            ],
            Projection: { ProjectionType: 'ALL' },
          },
        ],
      })
    );
    console.log(`Table ${tableName} created. Waiting for it to become active...`);
    await waitUntilTableExists({ client, maxWaitTime: 60 }, { TableName: tableName });
  } catch (error: any) {
    if (error?.name === 'ResourceInUseException') {
      console.log(`Table ${tableName} already exists. Skipping creation.`);
    } else {
      throw error;
    }
  }
};

const seed = async (): Promise<void> => {
  await ensureTable();

  const client = DynamoDBConnection.getClient();
  const tableName = DynamoDBConnection.getTableName();
  const items = [
    DynamoItemMapper.customerToItem(new Customer({ id: IDS.customer1, name: 'Cliente 1 Relacional' })),
    DynamoItemMapper.customerToItem(new Customer({ id: IDS.customer2, name: 'Cliente 2 Relacional' })),
    DynamoItemMapper.customerToItem(new Customer({ id: IDS.customer3, name: 'Cliente 3 Relacional' })),
    DynamoItemMapper.userToItem(
      new User({
        id: IDS.user1,
        username: 'user1',
        passwordHash: HASHES.user1,
        customerId: IDS.customer1,
        role: 'admin',
      })
    ),
    DynamoItemMapper.userToItem(
      new User({
        id: IDS.user2,
        username: 'user2',
        passwordHash: HASHES.user2,
        customerId: IDS.customer2,
        role: 'technician',
      })
    ),
    DynamoItemMapper.userToItem(
      new User({
        id: IDS.user3,
        username: 'user3',
        passwordHash: HASHES.user3,
        customerId: IDS.customer3,
        role: 'operator',
      })
    ),
    DynamoItemMapper.vesselToItem(
      new Vessel({
        id: IDS.vessel1,
        name: 'Vessel A',
        registrationNumber: 'REG-A-001',
        customerId: IDS.customer1,
      })
    ),
    DynamoItemMapper.vesselToItem(
      new Vessel({
        id: IDS.vessel2,
        name: 'Vessel B',
        registrationNumber: 'REG-B-002',
        customerId: IDS.customer2,
      })
    ),
    DynamoItemMapper.vesselToItem(
      new Vessel({
        id: IDS.vessel3,
        name: 'Vessel C',
        registrationNumber: 'REG-C-003',
        customerId: IDS.customer3,
      })
    ),
    DynamoItemMapper.componentToItem(
      new Component({
        id: IDS.component1,
        name: 'Motor Principal 1',
        vesselId: IDS.vessel1,
        customerId: IDS.customer1,
        serialNumber: 'SN-001',
      })
    ),
    DynamoItemMapper.componentToItem(
      new Component({
        id: IDS.component2,
        name: 'Bomba Hidráulica 2',
        vesselId: IDS.vessel2,
        customerId: IDS.customer2,
        serialNumber: 'SN-002',
      })
    ),
    DynamoItemMapper.componentToItem(
      new Component({
        id: IDS.component3,
        name: 'Generador Eléctrico 3',
        vesselId: IDS.vessel3,
        customerId: IDS.customer3,
        serialNumber: 'SN-003',
      })
    ),
    DynamoItemMapper.maintenanceToItem(
      new Maintenance({
        id: IDS.maintenance1,
        componentId: IDS.component1,
        customerId: IDS.customer1,
        description: 'Revisión programada de motor principal 1',
        status: 'pending',
        scheduledAt: dayOffset(5),
        createdBy: IDS.user1,
      })
    ),
    DynamoItemMapper.maintenanceToItem(
      new Maintenance({
        id: IDS.maintenance2,
        componentId: IDS.component2,
        customerId: IDS.customer2,
        description: 'Reemplazo de bomba hidráulica 2',
        status: 'completed',
        scheduledAt: dayOffset(-3),
        performedAt: dayOffset(-2),
        createdBy: IDS.user2,
      })
    ),
    DynamoItemMapper.maintenanceToItem(
      new Maintenance({
        id: IDS.maintenance3,
        componentId: IDS.component3,
        customerId: IDS.customer3,
        description: 'Ajuste y prueba de generador 3',
        status: 'in_progress',
        scheduledAt: new Date(),
        createdBy: IDS.user3,
      })
    ),
  ];

  for (const item of items) {
    await client.send(new PutCommand({ TableName: tableName, Item: item }));
  }

  console.log(`Seeded ${items.length} items into ${tableName}`);
};

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
