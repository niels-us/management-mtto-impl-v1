export class Component {
  id: string;
  name: string;
  vesselId: string;
  customerId: string;
  serialNumber: string;
  installedAt: Date;

  constructor(params: {
    id: string;
    name: string;
    vesselId: string;
    customerId: string;
    serialNumber: string;
    installedAt?: Date;
  }) {
    this.id = params.id;
    this.name = params.name;
    this.vesselId = params.vesselId;
    this.customerId = params.customerId;
    this.serialNumber = params.serialNumber;
    this.installedAt = params.installedAt || new Date();
  }
}
