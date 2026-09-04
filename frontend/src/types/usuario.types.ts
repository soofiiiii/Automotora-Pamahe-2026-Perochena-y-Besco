export interface Role {
  id: number;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}

export interface Usuario {
  id: number;
  username: string;
  email: string;
  nombre: string;
  telefono?: string | null;
  activo: boolean;
  roles: string[];
}

export interface UsuarioCreateRequest {
  username: string;
  email: string;
  nombre: string;
  telefono?: string;
  password: string;
  roles: string[];
}

export interface UsuarioUpdateRequest {
  email: string;
  nombre: string;
  telefono?: string;
  roles: string[];
  activo: boolean;
}