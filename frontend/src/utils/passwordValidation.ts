export function passwordValidation(password: string): string | undefined {
  if (password.length < 8 || password.length > 72) return "La contraseña debe contener entre 8 y 72 caracteres.";
  if (!password.trim()) return "La contraseña no puede estar formada únicamente por espacios en blanco.";
  if (new TextEncoder().encode(password).length > 72) return "Debido a los caracteres especiales, la contraseña es demasiado extensa para el sistema.";
  return undefined;
}