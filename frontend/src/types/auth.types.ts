export interface LoginRequest {
  username: string;
  password: string;
}
export interface LoginResponse {
  token: string;
  username: string;
  nombre: string;
  roles: string[];
}
export interface AuthSession extends LoginResponse {
  expiresAt?: number;
}
