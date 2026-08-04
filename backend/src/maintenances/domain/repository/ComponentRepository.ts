import { Component } from '../entities/Component.js';

export interface ComponentRepository {
  findAllByVessel(vesselId: string, customerId: string): Promise<Component[]>;
  findById(componentId: string, customerId?: string): Promise<Component | null>;
}
