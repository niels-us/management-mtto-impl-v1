export class User {
  id: string;
  username: string;
  passwordHash: string;
  customerId: string;
  role: 'admin' | 'user';

  constructor(params: {
    id: string;
    username: string;
    passwordHash: string;
    customerId: string;
    role?: 'admin' | 'user';
  }) {
    this.id = params.id;
    this.username = params.username;
    this.passwordHash = params.passwordHash;
    this.customerId = params.customerId;
    this.role = params.role || 'user';
  }
}
