import { Injectable } from '@nestjs/common';
import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  type QueryCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { DynamoDBConnection } from '../../../common/db/methods/DynamoDBConnection.js';
import { ENTITY, TableKeys } from '../../../common/db/keys/TableKeys.js';
import { DynamoItemMapper } from './DynamoItemMapper.js';
import { Customer } from '../../domain/entities/Customer.js';
import { User } from '../../domain/entities/User.js';
import { Vessel } from '../../domain/entities/Vessel.js';
import { Component } from '../../domain/entities/Component.js';
import { Maintenance, type MaintenanceStatus } from '../../domain/entities/Maintenance.js';
import type { CustomerRepository } from '../../domain/repository/CustomerRepository.js';
import type { UserRepository } from '../../domain/repository/UserRepository.js';
import type { VesselRepository } from '../../domain/repository/VesselRepository.js';
import type { ComponentRepository } from '../../domain/repository/ComponentRepository.js';
import type { MaintenanceRepository } from '../../domain/repository/MaintenanceRepository.js';

const isConditionalCheckFailed = (error: unknown): boolean =>
  error instanceof Error && error.name === 'ConditionalCheckFailedException';

@Injectable()
export class MaintenanceDynamoRepository
  implements CustomerRepository, UserRepository, VesselRepository, ComponentRepository, MaintenanceRepository
{
  private get client() {
    return DynamoDBConnection.getClient();
  }

  private get tableName(): string {
    return DynamoDBConnection.getTableName();
  }

  private async queryAll(params: Omit<QueryCommandInput, 'TableName'>): Promise<Record<string, any>[]> {
    const items: Record<string, any>[] = [];
    let exclusiveStartKey: Record<string, any> | undefined;

    do {
      const result = await this.client.send(
        new QueryCommand({ TableName: this.tableName, ...params, ExclusiveStartKey: exclusiveStartKey })
      );
      if (result.Items) items.push(...result.Items);
      exclusiveStartKey = result.LastEvaluatedKey;
    } while (exclusiveStartKey);

    return items;
  }

  async findCustomerById(customerId: string): Promise<Customer | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: TableKeys.entityKey(ENTITY.CUSTOMER, customerId),
        ConsistentRead: true,
      })
    );
    return result.Item ? DynamoItemMapper.customerFromItem(result.Item) : null;
  }

  async findByName(name: string): Promise<Customer | null> {
    const items = await this.queryAll({
      IndexName: 'GSI3',
      KeyConditionExpression: 'GSI3PK = :pk AND begins_with(GSI3SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': TableKeys.customerNameLookup(name),
        ':sk': TableKeys.entityPrefix(ENTITY.CUSTOMER),
      },
      Limit: 1,
    });
    return items.length > 0 ? DynamoItemMapper.customerFromItem(items[0]) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const items = await this.queryAll({
      IndexName: 'GSI3',
      KeyConditionExpression: 'GSI3PK = :pk AND begins_with(GSI3SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': TableKeys.usernameLookup(username),
        ':sk': TableKeys.entityPrefix(ENTITY.USER),
      },
      Limit: 1,
    });
    return items.length > 0 ? DynamoItemMapper.userFromItem(items[0]) : null;
  }

  async findUserById(id: string): Promise<User | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: TableKeys.entityKey(ENTITY.USER, id),
        ConsistentRead: true,
      })
    );
    return result.Item ? DynamoItemMapper.userFromItem(result.Item) : null;
  }

  async findAllByCustomer(customerId: string): Promise<Vessel[]> {
    const items = await this.queryAll({
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': TableKeys.customerPartition(customerId),
        ':sk': TableKeys.entityPrefix(ENTITY.VESSEL),
      },
    });
    return items.map((item) => DynamoItemMapper.vesselFromItem(item));
  }

  async findVesselById(vesselId: string, customerId?: string): Promise<Vessel | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: TableKeys.entityKey(ENTITY.VESSEL, vesselId),
        ConsistentRead: true,
      })
    );
    if (!result.Item) return null;
    const vessel = DynamoItemMapper.vesselFromItem(result.Item);
    if (customerId && vessel.customerId !== customerId) return null;
    return vessel;
  }

  async findAllByVessel(vesselId: string, customerId: string): Promise<Component[]> {
    const items = await this.queryAll({
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :pk',
      ExpressionAttributeValues: {
        ':pk': TableKeys.vesselPartition(vesselId),
      },
    });
    return items
      .filter((item) => item.customerId === customerId)
      .map((item) => DynamoItemMapper.componentFromItem(item));
  }

  async findById(componentId: string, customerId?: string): Promise<Component | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: TableKeys.entityKey(ENTITY.COMPONENT, componentId),
        ConsistentRead: true,
      })
    );
    if (!result.Item) return null;
    const component = DynamoItemMapper.componentFromItem(result.Item);
    if (customerId && component.customerId !== customerId) return null;
    return component;
  }

  async createMaintenance(maintenance: Maintenance): Promise<Maintenance> {
    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: DynamoItemMapper.maintenanceToItem(maintenance),
      })
    );
    return maintenance;
  }

  async findMaintenanceByCustomer(customerId: string): Promise<Maintenance[]> {
    const items = await this.queryAll({
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': TableKeys.customerPartition(customerId),
        ':sk': TableKeys.entityPrefix(ENTITY.MAINTENANCE),
      },
    });
    return items.map((item) => DynamoItemMapper.maintenanceFromItem(item));
  }

  async findMaintenanceById(maintenanceId: string, customerId?: string): Promise<Maintenance | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: TableKeys.entityKey(ENTITY.MAINTENANCE, maintenanceId),
        ConsistentRead: true,
      })
    );
    if (!result.Item) return null;
    const maintenance = DynamoItemMapper.maintenanceFromItem(result.Item);
    if (customerId && maintenance.customerId !== customerId) return null;
    return maintenance;
  }

  async updateStatus(maintenanceId: string, status: MaintenanceStatus, customerId?: string): Promise<Maintenance | null> {
    const expressionAttributeValues: Record<string, unknown> = {
      ':status': status,
      ':updatedAt': new Date().toISOString(),
    };

    let conditionExpression: string | undefined;
    if (customerId) {
      conditionExpression = 'customerId = :customerId';
      expressionAttributeValues[':customerId'] = customerId;
    }

    try {
      const result = await this.client.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: TableKeys.entityKey(ENTITY.MAINTENANCE, maintenanceId),
          UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
          ConditionExpression: conditionExpression,
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: expressionAttributeValues,
          ReturnValues: 'ALL_NEW',
        })
      );
      return result.Attributes ? DynamoItemMapper.maintenanceFromItem(result.Attributes) : null;
    } catch (error) {
      if (isConditionalCheckFailed(error)) return null;
      throw error;
    }
  }

  async deleteMaintenance(maintenanceId: string, customerId: string): Promise<boolean> {
    try {
      const result = await this.client.send(
        new DeleteCommand({
          TableName: this.tableName,
          Key: TableKeys.entityKey(ENTITY.MAINTENANCE, maintenanceId),
          ConditionExpression: 'customerId = :customerId',
          ExpressionAttributeValues: { ':customerId': customerId },
          ReturnValues: 'ALL_OLD',
        })
      );
      return Boolean(result.Attributes);
    } catch (error) {
      if (isConditionalCheckFailed(error)) return false;
      throw error;
    }
  }
}
