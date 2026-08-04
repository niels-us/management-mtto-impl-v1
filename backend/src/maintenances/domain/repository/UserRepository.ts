import { User } from '../entities/User.js';

export interface UserRepository {
  findByUsername(username: string): Promise<User | null>;
  findUserById(id: string): Promise<User | null>;
}
