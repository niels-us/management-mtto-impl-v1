export interface User {
  sub?: string;
  customerId?: string;
  username?: string;
  role?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}
