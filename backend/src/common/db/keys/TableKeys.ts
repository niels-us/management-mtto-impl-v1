export const ENTITY = {
  CUSTOMER: 'CUSTOMER',
  USER: 'USER',
  VESSEL: 'VESSEL',
  COMPONENT: 'COMPONENT',
  MAINTENANCE: 'MAINTENANCE',
} as const;

export type EntityType = (typeof ENTITY)[keyof typeof ENTITY];

export const GSI = {
  BY_CUSTOMER: 'GSI1',
  BY_VESSEL: 'GSI2',
  BY_LOOKUP: 'GSI3',
} as const;

export const TableKeys = {
  entityKey(entity: EntityType, id: string): Record<string, string> {
    return { PK: `${entity}#${id}`, SK: `${entity}#${id}` };
  },

  entityPrefix(entity: EntityType): string {
    return `${entity}#`;
  },

  customerPartition(customerId: string): string {
    return `CUSTOMER#${customerId}`;
  },

  vesselPartition(vesselId: string): string {
    return `VESSEL#${vesselId}`;
  },

  customerNameLookup(name: string): string {
    return `CUSTOMER_NAME#${name}`;
  },

  usernameLookup(username: string): string {
    return `USERNAME#${username}`;
  },
};
