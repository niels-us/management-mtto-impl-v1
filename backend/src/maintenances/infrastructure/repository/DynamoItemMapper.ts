import { Customer } from '../../domain/entities/Customer.js';
import { User } from '../../domain/entities/User.js';
import { Vessel } from '../../domain/entities/Vessel.js';
import { Component } from '../../domain/entities/Component.js';
import { Maintenance } from '../../domain/entities/Maintenance.js';
import { ENTITY, TableKeys } from '../../../common/db/keys/TableKeys.js';

const toIso = (value: Date | string | null | undefined): string | undefined => {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
};

const fromIso = (value: unknown): Date | undefined => {
  if (!value) return undefined;
  return new Date(value as string);
};

export const DynamoItemMapper = {
  customerToItem(customer: Customer): Record<string, unknown> {
    return {
      PK: `${ENTITY.CUSTOMER}#${customer.id}`,
      SK: `${ENTITY.CUSTOMER}#${customer.id}`,
      entityType: ENTITY.CUSTOMER,
      id: customer.id,
      name: customer.name,
      createdAt: toIso(customer.createdAt),
      updatedAt: toIso(customer.updatedAt),
      GSI3PK: TableKeys.customerNameLookup(customer.name),
      GSI3SK: `${ENTITY.CUSTOMER}#${customer.id}`,
    };
  },

  customerFromItem(item: Record<string, any>): Customer {
    return new Customer({
      id: item.id,
      name: item.name,
      createdAt: fromIso(item.createdAt),
      updatedAt: fromIso(item.updatedAt),
    });
  },

  userToItem(user: User): Record<string, unknown> {
    return {
      PK: `${ENTITY.USER}#${user.id}`,
      SK: `${ENTITY.USER}#${user.id}`,
      entityType: ENTITY.USER,
      id: user.id,
      username: user.username,
      passwordHash: user.passwordHash,
      customerId: user.customerId,
      role: user.role,
      GSI3PK: TableKeys.usernameLookup(user.username),
      GSI3SK: `${ENTITY.USER}#${user.id}`,
    };
  },

  userFromItem(item: Record<string, any>): User {
    return new User({
      id: item.id,
      username: item.username,
      passwordHash: item.passwordHash,
      customerId: item.customerId,
      role: item.role,
    });
  },

  vesselToItem(vessel: Vessel): Record<string, unknown> {
    return {
      PK: `${ENTITY.VESSEL}#${vessel.id}`,
      SK: `${ENTITY.VESSEL}#${vessel.id}`,
      entityType: ENTITY.VESSEL,
      id: vessel.id,
      name: vessel.name,
      registrationNumber: vessel.registrationNumber,
      customerId: vessel.customerId,
      createdAt: toIso(vessel.createdAt),
      GSI1PK: TableKeys.customerPartition(vessel.customerId),
      GSI1SK: `${ENTITY.VESSEL}#${vessel.id}`,
    };
  },

  vesselFromItem(item: Record<string, any>): Vessel {
    return new Vessel({
      id: item.id,
      name: item.name,
      registrationNumber: item.registrationNumber,
      customerId: item.customerId,
      createdAt: fromIso(item.createdAt),
    });
  },

  componentToItem(component: Component): Record<string, unknown> {
    return {
      PK: `${ENTITY.COMPONENT}#${component.id}`,
      SK: `${ENTITY.COMPONENT}#${component.id}`,
      entityType: ENTITY.COMPONENT,
      id: component.id,
      name: component.name,
      vesselId: component.vesselId,
      customerId: component.customerId,
      serialNumber: component.serialNumber,
      installedAt: toIso(component.installedAt),
      GSI2PK: TableKeys.vesselPartition(component.vesselId),
      GSI2SK: `${ENTITY.COMPONENT}#${component.id}`,
    };
  },

  componentFromItem(item: Record<string, any>): Component {
    return new Component({
      id: item.id,
      name: item.name,
      vesselId: item.vesselId,
      customerId: item.customerId,
      serialNumber: item.serialNumber,
      installedAt: fromIso(item.installedAt),
    });
  },

  maintenanceToItem(maintenance: Maintenance): Record<string, unknown> {
    return {
      PK: `${ENTITY.MAINTENANCE}#${maintenance.id}`,
      SK: `${ENTITY.MAINTENANCE}#${maintenance.id}`,
      entityType: ENTITY.MAINTENANCE,
      id: maintenance.id,
      componentId: maintenance.componentId,
      customerId: maintenance.customerId,
      description: maintenance.description,
      status: maintenance.status,
      scheduledAt: toIso(maintenance.scheduledAt),
      performedAt: toIso(maintenance.performedAt),
      createdBy: maintenance.createdBy,
      createdAt: toIso(maintenance.createdAt),
      updatedAt: toIso(maintenance.updatedAt),
      GSI1PK: TableKeys.customerPartition(maintenance.customerId),
      GSI1SK: `${ENTITY.MAINTENANCE}#${maintenance.id}`,
    };
  },

  maintenanceFromItem(item: Record<string, any>): Maintenance {
    return new Maintenance({
      id: item.id,
      componentId: item.componentId,
      customerId: item.customerId,
      description: item.description,
      status: item.status,
      scheduledAt: fromIso(item.scheduledAt) || new Date(),
      performedAt: fromIso(item.performedAt),
      createdBy: item.createdBy,
      createdAt: fromIso(item.createdAt),
      updatedAt: fromIso(item.updatedAt),
    });
  },
};
