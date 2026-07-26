export class Vessel {
  id: string;
  name: string;
  registrationNumber: string;
  customerId: string;
  createdAt: Date;

  constructor(params: { id: string; name: string; registrationNumber: string; customerId: string; createdAt?: Date }) {
    this.id = params.id;
    this.name = params.name;
    this.registrationNumber = params.registrationNumber;
    this.customerId = params.customerId;
    this.createdAt = params.createdAt || new Date();
  }
}
