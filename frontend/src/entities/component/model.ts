export interface Component {
  id: string;
  name: string;
  vesselId: string;
  customerId: string;
  serialNumber: string | null;
  installedAt: string | null;
}
