import { Vessel } from '../entities/Vessel';

export interface VesselRepository {
  findAllByCustomer(customerId: string): Promise<Vessel[]>;
  findVesselById(id: string, customerId?: string): Promise<Vessel | null>;
}
