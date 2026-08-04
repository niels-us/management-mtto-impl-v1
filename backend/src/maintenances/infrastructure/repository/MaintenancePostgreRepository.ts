import { Injectable } from '@nestjs/common';
import type { PoolClient } from 'pg';
import { PostgreSQLConnection } from '../../../common/db/methods/PostgreSQLConnection.js';
import { Customer } from '../../domain/entities/Customer.js';
import { User } from '../../domain/entities/User.js';
import { Vessel } from '../../domain/entities/Vessel.js';
import { Component } from '../../domain/entities/Component.js';
import { Maintenance } from '../../domain/entities/Maintenance.js';
import type { CustomerRepository } from '../../domain/repository/CustomerRepository.js';
import type { UserRepository } from '../../domain/repository/UserRepository.js';
import type { VesselRepository } from '../../domain/repository/VesselRepository.js';
import type { ComponentRepository } from '../../domain/repository/ComponentRepository.js';
import type { MaintenanceRepository } from '../../domain/repository/MaintenanceRepository.js';

@Injectable()
export class MaintenancePostgreRepository
  implements CustomerRepository, UserRepository, VesselRepository, ComponentRepository, MaintenanceRepository
{
  private async withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await PostgreSQLConnection.getConnection();
    try {
      return await fn(client);
    } finally {
      await PostgreSQLConnection.closeConnection(client);
    }
  }

  async findCustomerById(customerId: string): Promise<Customer | null> {
    return this.withClient(async (client) => {
      const result = await client.query('SELECT id, name, created_at, updated_at FROM customers WHERE id = $1', [
        customerId,
      ]);
      if (result.rowCount === 0) return null;
      const row = result.rows[0];
      return new Customer({ id: row.id, name: row.name, createdAt: row.created_at, updatedAt: row.updated_at });
    });
  }

  async findByName(name: string): Promise<Customer | null> {
    return this.withClient(async (client) => {
      const result = await client.query('SELECT id, name, created_at, updated_at FROM customers WHERE name = $1', [
        name,
      ]);
      if (result.rowCount === 0) return null;
      const row = result.rows[0];
      return new Customer({ id: row.id, name: row.name, createdAt: row.created_at, updatedAt: row.updated_at });
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.withClient(async (client) => {
      const result = await client.query(
        'SELECT id, username, password_hash, customer_id, role FROM users WHERE username = $1',
        [username]
      );
      if (result.rowCount === 0) return null;
      const row = result.rows[0];
      return new User({
        id: row.id,
        username: row.username,
        passwordHash: row.password_hash,
        customerId: row.customer_id,
        role: row.role,
      });
    });
  }

  async findUserById(id: string): Promise<User | null> {
    return this.withClient(async (client) => {
      const result = await client.query(
        'SELECT id, username, password_hash, customer_id, role FROM users WHERE id = $1',
        [id]
      );
      if (result.rowCount === 0) return null;
      const row = result.rows[0];
      return new User({
        id: row.id,
        username: row.username,
        passwordHash: row.password_hash,
        customerId: row.customer_id,
        role: row.role,
      });
    });
  }

  async findAllByCustomer(customerId: string): Promise<Vessel[]> {
    return this.withClient(async (client) => {
      const result = await client.query(
        'SELECT id, name, registration_number, customer_id, created_at FROM vessels WHERE customer_id = $1',
        [customerId]
      );
      return result.rows.map(
        (r) =>
          new Vessel({
            id: r.id,
            name: r.name,
            registrationNumber: r.registration_number,
            customerId: r.customer_id,
            createdAt: r.created_at,
          })
      );
    });
  }

  async findVesselById(vesselId: string, customerId?: string): Promise<Vessel | null> {
    return this.withClient(async (client) => {
      let query = 'SELECT id, name, registration_number, customer_id, created_at FROM vessels WHERE id = $1';
      const params = [vesselId];

      if (customerId) {
        query += ' AND customer_id = $2';
        params.push(customerId);
      }

      const result = await client.query(query, params);
      if (result.rowCount === 0) return null;
      const row = result.rows[0];
      return new Vessel({
        id: row.id,
        name: row.name,
        registrationNumber: row.registration_number,
        customerId: row.customer_id,
        createdAt: row.created_at,
      });
    });
  }

  async findAllByVessel(vesselId: string, customerId: string): Promise<Component[]> {
    return this.withClient(async (client) => {
      const result = await client.query(
        'SELECT id, name, vessel_id, customer_id, serial_number, installed_at FROM components WHERE vessel_id = $1 AND customer_id = $2',
        [vesselId, customerId]
      );
      return result.rows.map(
        (r) =>
          new Component({
            id: r.id,
            name: r.name,
            vesselId: r.vessel_id,
            customerId: r.customer_id,
            serialNumber: r.serial_number,
            installedAt: r.installed_at,
          })
      );
    });
  }

  async findById(componentId: string, customerId?: string): Promise<Component | null> {
    return this.withClient(async (client) => {
      let query = 'SELECT id, name, vessel_id, customer_id, serial_number, installed_at FROM components WHERE id = $1';
      const params = [componentId];

      if (customerId) {
        query += ' AND customer_id = $2';
        params.push(customerId);
      }

      const result = await client.query(query, params);
      if (result.rowCount === 0) return null;
      const r = result.rows[0];
      return new Component({
        id: r.id,
        name: r.name,
        vesselId: r.vessel_id,
        customerId: r.customer_id,
        serialNumber: r.serial_number,
        installedAt: r.installed_at,
      });
    });
  }

  async createMaintenance(maintenance: Maintenance): Promise<Maintenance> {
    return this.withClient(async (client) => {
      const query = `INSERT INTO maintenance (id, component_id, customer_id, description, status, scheduled_at, performed_at, created_by, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`;
      await client.query(query, [
        maintenance.id,
        maintenance.componentId,
        maintenance.customerId,
        maintenance.description,
        maintenance.status,
        maintenance.scheduledAt,
        maintenance.performedAt || null,
        maintenance.createdBy,
        maintenance.createdAt,
        maintenance.updatedAt,
      ]);
      return maintenance;
    });
  }

  async findMaintenanceByCustomer(customerId: string): Promise<Maintenance[]> {
    return this.withClient(async (client) => {
      const result = await client.query(
        'SELECT id, component_id, customer_id, description, status, scheduled_at, performed_at, created_by, created_at, updated_at FROM maintenance WHERE customer_id = $1',
        [customerId]
      );
      return result.rows.map(
        (r) =>
          new Maintenance({
            id: r.id,
            componentId: r.component_id,
            customerId: r.customer_id,
            description: r.description,
            status: r.status,
            scheduledAt: r.scheduled_at,
            performedAt: r.performed_at,
            createdBy: r.created_by,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          })
      );
    });
  }

  async findMaintenanceById(maintenanceId: string, customerId?: string): Promise<Maintenance | null> {
    return this.withClient(async (client) => {
      let query =
        'SELECT id, component_id, customer_id, description, status, scheduled_at, performed_at, created_by, created_at, updated_at FROM maintenance WHERE id = $1';
      const params = [maintenanceId];

      if (customerId) {
        query += ' AND customer_id = $2';
        params.push(customerId);
      }

      const result = await client.query(query, params);
      if (result.rowCount === 0) return null;
      const r = result.rows[0];
      return new Maintenance({
        id: r.id,
        componentId: r.component_id,
        customerId: r.customer_id,
        description: r.description,
        status: r.status,
        scheduledAt: r.scheduled_at,
        performedAt: r.performed_at,
        createdBy: r.created_by,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      });
    });
  }

  async updateStatus(maintenanceId: string, status: string, customerId?: string): Promise<Maintenance | null> {
    return this.withClient(async (client) => {
      let query = 'UPDATE maintenance SET status = $1, updated_at = NOW() WHERE id = $2';
      const params: any[] = [status, maintenanceId];

      if (customerId) {
        query += ' AND customer_id = $3';
        params.push(customerId);
      }

      query +=
        ' RETURNING id, component_id, customer_id, description, status, scheduled_at, performed_at, created_by, created_at, updated_at';

      const update = await client.query(query, params);
      if (update.rowCount === 0) return null;
      const r = update.rows[0];
      return new Maintenance({
        id: r.id,
        componentId: r.component_id,
        customerId: r.customer_id,
        description: r.description,
        status: r.status,
        scheduledAt: r.scheduled_at,
        performedAt: r.performed_at,
        createdBy: r.created_by,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      });
    });
  }

  async deleteMaintenance(maintenanceId: string, customerId: string): Promise<boolean> {
    return this.withClient(async (client) => {
      const result = await client.query('DELETE FROM maintenance WHERE id = $1 AND customer_id = $2', [
        maintenanceId,
        customerId,
      ]);
      return (result.rowCount ?? 0) > 0;
    });
  }
}
