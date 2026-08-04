import { Injectable } from '@nestjs/common';
import { MaintenanceDomainService } from '../../domain/service/MaintenanceDomainService.js';
import { Maintenance } from '../../domain/entities/Maintenance.js';
import { User } from '../../domain/entities/User.js';
import { Vessel } from '../../domain/entities/Vessel.js';
import { Component } from '../../domain/entities/Component.js';
import jwt from 'jsonwebtoken';

@Injectable()
export class MaintenanceApplicationService {
  constructor(private readonly maintenanceDomainService: MaintenanceDomainService) {}

  async login(username: string, passwordHash: string): Promise<{ token: string; user: User }> {
    const user = await this.maintenanceDomainService.authenticate(username, passwordHash);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable not configured');
    }

    const token = jwt.sign({ sub: user.id, username: user.username, customerId: user.customerId }, secret, {
      expiresIn: '8h',
      algorithm: 'HS256',
      audience: process.env.JWT_AUDIENCE || 'maintenance-api',
      issuer: process.env.JWT_ISSUER || 'maintenance-api',
    });

    return { token, user };
  }

  async getVessels(customerId: string): Promise<Vessel[]> {
    return this.maintenanceDomainService.getVessels(customerId);
  }

  async getVesselComponents(vesselId: string, customerId: string): Promise<Component[]> {
    return this.maintenanceDomainService.getVesselComponents(vesselId, customerId);
  }

  async createMaintenance(maintenance: Maintenance): Promise<Maintenance> {
    return this.maintenanceDomainService.createMaintenance(maintenance);
  }

  async getMaintenances(customerId: string, status?: string): Promise<Maintenance[]> {
    return this.maintenanceDomainService.getMaintenances(customerId, status);
  }

  async updateMaintenanceStatus(
    customerId: string,
    maintenanceId: string,
    status: string
  ): Promise<Maintenance | null> {
    return this.maintenanceDomainService.updateMaintenanceStatus(customerId, maintenanceId, status as any);
  }

  async deleteMaintenance(customerId: string, maintenanceId: string): Promise<void> {
    return this.maintenanceDomainService.deleteMaintenance(customerId, maintenanceId);
  }
}
