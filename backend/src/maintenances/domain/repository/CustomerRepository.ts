import { Customer } from '../entities/Customer.js';

export interface CustomerRepository {
  findCustomerById(customerId: string): Promise<Customer | null>;
  findByName(name: string): Promise<Customer | null>;
}
