import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { CustomerRepository } from '../repository/CustomerRepository.js';
import type { UserRepository } from '../repository/UserRepository.js';
import type { VesselRepository } from '../repository/VesselRepository.js';
import type { ComponentRepository } from '../repository/ComponentRepository.js';
import type { MaintenanceRepository } from '../repository/MaintenanceRepository.js';
import { Customer } from '../entities/Customer.js';
import { User } from '../entities/User.js';
import { Vessel } from '../entities/Vessel.js';
import { Component } from '../entities/Component.js';
import { Maintenance, type MaintenanceStatus } from '../entities/Maintenance.js';
import CustomException from '../../../common/application/exception/CustomException.js';

@Injectable()
export class MaintenanceDomainService {
  constructor(
    @Inject('CustomerRepository') private readonly customerRepository: CustomerRepository,
    @Inject('UserRepository') private readonly userRepository: UserRepository,
    @Inject('VesselRepository') private readonly vesselRepository: VesselRepository,
    @Inject('ComponentRepository') private readonly componentRepository: ComponentRepository,
    @Inject('MaintenanceRepository') private readonly maintenanceRepository: MaintenanceRepository
  ) {}

  async authenticate(username: string, passwordHash: string): Promise<User | null> {
    const user = await this.userRepository.findByUsername(username);
    if (!user) return null;

    const passwordMatches = await bcrypt.compare(passwordHash, user.passwordHash);
    if (!passwordMatches) return null;

    return user;
  }

  async getVessels(customerId: string): Promise<Vessel[]> {
    return this.vesselRepository.findAllByCustomer(customerId);
  }

  async getVesselComponents(vesselId: string, customerId: string): Promise<Component[]> {
    const vessel = await this.vesselRepository.findVesselById(vesselId, customerId);
    if (!vessel || vessel.customerId !== customerId) {
      throw new CustomException({ code: 'RES404', message: 'Vessel not found or access denied', httpStatus: 404 });
    }
    return this.componentRepository.findAllByVessel(vesselId, customerId);
  }

  async createMaintenance(maintenance: Maintenance): Promise<Maintenance> {
    const component = await this.componentRepository.findById(maintenance.componentId, maintenance.customerId);
    if (!component || component.customerId !== maintenance.customerId) {
      throw new CustomException({ code: 'RES404', message: 'Component not found or access denied', httpStatus: 404 });
    }
    return this.maintenanceRepository.createMaintenance(maintenance);
  }

  async getMaintenances(customerId: string, status?: string): Promise<Maintenance[]> {
    const maintenances = await this.maintenanceRepository.findMaintenanceByCustomer(customerId);

    if (!status) {
      return maintenances;
    }

    return maintenances.filter((m) => m.status === status.toLowerCase());
  }

  async updateMaintenanceStatus(
    customerId: string,
    maintenanceId: string,
    status: MaintenanceStatus
  ): Promise<Maintenance | null> {
    const maintenance = await this.maintenanceRepository.findMaintenanceById(maintenanceId, customerId);
    if (!maintenance || maintenance.customerId !== customerId) {
      throw new CustomException({ code: 'RES404', message: 'Maintenance not found or access denied', httpStatus: 404 });
    }
    return this.maintenanceRepository.updateStatus(maintenanceId, status, customerId);
  }

  async deleteMaintenance(customerId: string, maintenanceId: string): Promise<void> {
    const maintenance = await this.maintenanceRepository.findMaintenanceById(maintenanceId, customerId);
    if (!maintenance || maintenance.customerId !== customerId) {
      throw new CustomException({ code: 'RES404', message: 'Maintenance not found or access denied', httpStatus: 404 });
    }
    const deleted = await this.maintenanceRepository.deleteMaintenance(maintenanceId, customerId);
    if (!deleted) {
      throw new CustomException({ code: 'RES404', message: 'Maintenance not found or access denied', httpStatus: 404 });
    }
  }
}
