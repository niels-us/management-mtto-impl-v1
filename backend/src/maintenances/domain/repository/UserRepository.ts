import { User } from '../entities/User';

export interface UserRepository {
  findByUsername(username: string): Promise<User | null>;
  findUserById(id: string): Promise<User | null>;
}
