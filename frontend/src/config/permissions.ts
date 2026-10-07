export type AppRole = "ADMINISTRADOR" | "DUENO" | "VENDEDOR" | "TALLER";

export const MANAGEMENT_ROLES: AppRole[] = ["ADMINISTRADOR", "DUENO"];
export const PURCHASE_RECEIPT_ROLES: AppRole[] = MANAGEMENT_ROLES;
export const IMAGE_DELETE_ROLES: AppRole[] = ["ADMINISTRADOR", "DUENO"];
export const INTERNAL_OBSERVATIONS_ROLES: AppRole[] = ["ADMINISTRADOR", "DUENO"];
export const COMMERCIAL_ROLES: AppRole[] = ["ADMINISTRADOR", "DUENO", "VENDEDOR"];
export const REVIEW_NOTIFICATION_ROLES: AppRole[] = ["ADMINISTRADOR", "DUENO", "VENDEDOR"];
export const WORKSHOP_ROLES: AppRole[] = ["ADMINISTRADOR", "DUENO", "TALLER"];
export const INTERNAL_ROLES: AppRole[] = ["ADMINISTRADOR", "DUENO", "VENDEDOR", "TALLER"];

export const normalizeRole = (role: string) =>
  role.trim().toUpperCase().replace(/^ROLE_/, "") as AppRole;

export const normalizeRoles = (roles: string[] = []) =>
  [...new Set(roles.map(normalizeRole))].filter((role): role is AppRole =>
    INTERNAL_ROLES.includes(role),
  );

export const hasAnyRole = (roles: string[], allowed: AppRole[]) =>
  roles.some((role) => allowed.includes(role as AppRole));
