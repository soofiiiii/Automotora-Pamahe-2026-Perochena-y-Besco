export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  nombre: string;
  roles: string[];
  debeCambiarPassword?: boolean;
}

export interface CurrentUserResponse {
  username: string;
  nombre: string;
  roles: string[];
  activo?: boolean;
  debeCambiarPassword?: boolean;
}

export interface AuthSession extends LoginResponse {
  expiresAt?: number;
}

export interface ChangePasswordRequest {
  passwordActual: string;
  nuevaPassword: string;
}

export interface ResetPasswordRequest {
  nuevaPassword: string;
}
