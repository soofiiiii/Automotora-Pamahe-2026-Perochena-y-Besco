import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { passwordValidation } from "../../../utils/passwordValidation";
import { usuarioService } from "../../../services/api";
import type {
  Role,
  UsuarioCreateRequest,
  UsuarioUpdateRequest,
} from "../../../types/usuario.types";
import { FormField } from "../../../shared/forms/FormField";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { useToast } from "../../../shared/feedback/useToast";
import { errorMessage } from "../../../utils/errorMessage";

const schema = z.object({
  username: z.string().trim().min(3, "El usuario debe tener al menos 3 caracteres.").max(60, "El usuario no puede superar los 60 caracteres."),
  email: z.string().trim().email("Ingresá un email válido.").max(120, "El email no puede superar los 120 caracteres."),
  nombre: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres.").max(120, "El nombre no puede superar los 120 caracteres."),
  telefono: z.string().trim().max(30, "El teléfono no puede superar los 30 caracteres.").optional(),
  password: z.string().max(72, "La contraseña no puede superar los 72 caracteres.").optional(),
  roles: z.array(z.string()).min(1, "Elegí al menos un rol."),
  activo: z.boolean(),
});

type Values = z.infer<typeof schema>;

export default function UsuarioFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const nav = useNavigate();
  const { show } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      email: "",
      nombre: "",
      telefono: "",
      password: "",
      roles: [],
      activo: true,
    },
  });

  useEffect(() => {
    usuarioService
      .roles()
      .then(setRoles)
      .catch(() =>
        setRoles([
          { id: 1, nombre: "ADMINISTRADOR" },
          { id: 2, nombre: "DUENO" },
          { id: 3, nombre: "VENDEDOR" },
          { id: 4, nombre: "TALLER" },
        ]),
      );
    if (id)
      usuarioService
        .get(Number(id))
        .then((u) =>
          reset({
            username: u.username,
            email: u.email,
            nombre: u.nombre,
            telefono: u.telefono ?? "",
            password: "",
            roles: u.roles,
            activo: u.activo,
          }),
        )
        .catch((e) => show(errorMessage(e, "No pudimos cargar los datos del usuario."), "error"));
  }, [id, reset, show]);

  const selected = useWatch({
    control,
    name: "roles",
  });

  return (
    <>
      <PageHeader
        title={editing ? "Editar usuario" : "Nuevo usuario"}
        description={
          editing
            ? "Podés modificar los datos personales, roles y estado de la cuenta. El nombre de usuario no se puede cambiar."
            : "La contraseña inicial debe tener al menos 8 caracteres."
        }
      />
      <form
        className="card"
        onSubmit={handleSubmit(async (v) => {
          try {
            if (editing) {
              const body: UsuarioUpdateRequest = {
                nombre: v.nombre.trim(),
                email: v.email.trim().toLowerCase(),
                telefono: v.telefono || undefined,
                roles: v.roles,
                activo: v.activo,
              };
              await usuarioService.update(Number(id), body);
            } else {
              const passwordError = passwordValidation(v.password ?? "");
              if (passwordError || !v.password) {
                show(passwordError || "Ingresá una contraseña.", "error");
                return;
              }
              const body: UsuarioCreateRequest = {
                username: v.username.trim().toLowerCase(),
                nombre: v.nombre.trim(),
                email: v.email.trim().toLowerCase(),
                telefono: v.telefono || undefined,
                password: v.password,
                roles: v.roles,
              };
              await usuarioService.create(body);
            }
            show(
              editing ? "Usuario actualizado." : "Usuario creado.",
              "success",
            );
            nav("/app/usuarios");
          } catch (e) {
            show(errorMessage(e, editing ? "No pudimos actualizar el usuario." : "No pudimos crear el usuario."), "error");
          }
        })}
      >
        <div className="form-grid">
          <FormField label="Usuario" error={errors.username?.message}>
            <input
              readOnly={editing}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              {...register("username")}
            />
          </FormField>
          <FormField label="Nombre" error={errors.nombre?.message}>
            <input {...register("nombre")} />
          </FormField>
          <FormField label="Email" error={errors.email?.message}>
            <input type="email" autoComplete="email" {...register("email")} />
          </FormField>
          <FormField label="Teléfono" error={errors.telefono?.message}>
            <input type="tel" autoComplete="tel" {...register("telefono")} />
          </FormField>
          {!editing && (
            <FormField label="Contraseña" error={errors.password?.message}>
              <input
                type="password"
                autoComplete="new-password"
                maxLength={72}
                {...register("password")}
              />
            </FormField>
          )}
        </div>
        <fieldset className="role-picker">
          <legend>Roles</legend>
          {roles.map((r) => (
            <label key={r.id}>
              <input
                type="checkbox"
                checked={selected.includes(r.nombre)}
                onChange={(e) =>
                  setValue(
                    "roles",
                    e.target.checked
                      ? [...selected, r.nombre]
                      : selected.filter((x) => x !== r.nombre),
                    { shouldValidate: true },
                  )
                }
              />
              {r.nombre}
            </label>
          ))}
          {errors.roles?.message && (
            <small className="field__error">{errors.roles.message}</small>
          )}
        </fieldset>
        {editing && (
          <label className="check">
            <input type="checkbox" {...register("activo")} />
            Cuenta activa
          </label>
        )}
        <div className="form-actions">
          <Link className="button button--secondary" to="/app/usuarios">
            Cancelar
          </Link>
          <button className="button" disabled={isSubmitting}>
            {isSubmitting ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </>
  );
}
