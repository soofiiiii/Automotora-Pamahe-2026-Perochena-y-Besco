import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { clienteService } from "../../../services/api";
import { FormField } from "../../../shared/forms/FormField";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { useToast } from "../../../shared/feedback/useToast";
import { errorMessage } from "../../../utils/errorMessage";
import type { Cliente } from "../../../types/domain.types";

const schema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "Ingresá el nombre.")
    .max(100, "El nombre no puede superar los 100 caracteres."),
  apellido: z
    .string()
    .trim()
    .max(100, "El apellido no puede superar los 100 caracteres.")
    .optional(),
  razonSocial: z
    .string()
    .trim()
    .max(150, "La razón social no puede superar los 150 caracteres.")
    .optional(),
  documento: z
    .string()
    .trim()
    .min(5, "Ingresá un documento válido.")
    .max(30, "El documento no puede superar los 30 caracteres."),
  telefono: z
    .string()
    .trim()
    .max(30, "El teléfono no puede superar los 30 caracteres.")
    .optional(),
  email: z
    .union([
      z
        .string()
        .trim()
        .email("Ingresá un email válido.")
        .max(120, "El email no puede superar los 120 caracteres."),
      z.literal(""),
    ])
    .optional(),
  direccion: z
    .string()
    .trim()
    .max(180, "La dirección no puede superar los 180 caracteres.")
    .optional(),
  tipoCliente: z.enum(["COMPRADOR", "VENDEDOR", "AMBOS"]),
});

type Values = z.infer<typeof schema>;

export default function ClienteFormPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { show } = useToast();

  const [duplicateLookup, setDuplicateLookup] = useState<{
    documento: string;
    cliente: Cliente | null;
  }>({
    documento: "",
    cliente: null,
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: "",
      apellido: "",
      razonSocial: "",
      documento: "",
      telefono: "",
      email: "",
      direccion: "",
      tipoCliente: "COMPRADOR",
    },
  });

  const documento = useWatch({ control, name: "documento" }) ?? "";
  const documentoNormalizado = documento.trim();

  const duplicateClient =
    documentoNormalizado.length >= 5 &&
    duplicateLookup.documento === documentoNormalizado
      ? duplicateLookup.cliente
      : null;

  useEffect(() => {
    if (id)
      clienteService
        .get(Number(id))
        .then((c) =>
          reset({
            nombre: c.nombre,
            apellido: c.apellido ?? "",
            razonSocial: c.razonSocial ?? "",
            documento: c.documento,
            telefono: c.telefono ?? "",
            email: c.email ?? "",
            direccion: c.direccion ?? "",
            tipoCliente: c.tipoCliente,
          }),
        )
        .catch((e) =>
          show(
            errorMessage(e, "No pudimos cargar los datos del cliente."),
            "error",
          ),
        );
  }, [id, reset, show]);

  useEffect(() => {
    if (documentoNormalizado.length < 5) {
      return;
    }

    const controller = new AbortController();

    const timeout = window.setTimeout(() => {
      void clienteService
        .findByDocument(documentoNormalizado, controller.signal)
        .then((cliente) => {
          const currentId = id ? Number(id) : null;
          const duplicate =
            cliente && cliente.id !== currentId ? cliente : null;

          setDuplicateLookup({
            documento: documentoNormalizado,
            cliente: duplicate,
          });
        })
        .catch(() => {
          if (controller.signal.aborted) {
            return;
          }

          setDuplicateLookup({
            documento: documentoNormalizado,
            cliente: null,
          });
        });
    }, 350);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [documentoNormalizado, id]);

  return (
    <>
      <PageHeader
        title={id ? "Editar cliente" : "Nuevo cliente"}
        description="Los clientes quedan disponibles para asociarlos a compras y ventas según su tipo comercial."
      />
      <form
        className="card"
        noValidate
        onSubmit={handleSubmit(async (v) => {
          try {
            const body = {
              ...v,
              telefono: v.telefono || undefined,
              email: v.email || undefined,
            };
            if (id) await clienteService.update(Number(id), body);
            else await clienteService.create(body);
            show(
              id
                ? "Cliente actualizado correctamente."
                : "Cliente creado correctamente.",
              "success",
            );
            nav("/app/clientes");
          } catch (e) {
            show(
              errorMessage(
                e,
                id
                  ? "No pudimos actualizar el cliente."
                  : "No pudimos crear el cliente.",
              ),
              "error",
            );
          }
        })}
      >
        <div className="notice privacy-form-notice">
          Registrá únicamente los datos necesarios para la relación comercial.
          Verificá que la persona conozca la finalidad del tratamiento y evitá
          observaciones con información sensible innecesaria.
        </div>
        <div className="form-grid">
          <FormField label="Nombre" error={errors.nombre?.message}>
            <input autoComplete="given-name" {...register("nombre")} />
          </FormField>
          <FormField label="Apellido" error={errors.apellido?.message}>
            <input autoComplete="family-name" {...register("apellido")} />
          </FormField>
          <FormField label="Razón social" error={errors.razonSocial?.message}>
            <input {...register("razonSocial")} />
          </FormField>
          <FormField label="Documento" error={errors.documento?.message}>
            <input autoComplete="off" {...register("documento")} />
          </FormField>
          <FormField label="Teléfono" error={errors.telefono?.message}>
            <input type="tel" autoComplete="tel" {...register("telefono")} />
          </FormField>
          <FormField label="Email" error={errors.email?.message}>
            <input type="email" autoComplete="email" {...register("email")} />
          </FormField>
          <FormField label="Dirección" error={errors.direccion?.message}>
            <input autoComplete="street-address" {...register("direccion")} />
          </FormField>
          <FormField label="Tipo" error={errors.tipoCliente?.message}>
            <select {...register("tipoCliente")}>
              <option value="COMPRADOR">Comprador</option>
              <option value="VENDEDOR">Vendedor</option>
              <option value="AMBOS">Ambos</option>
            </select>
          </FormField>
        </div>
        {duplicateClient && (
          <div className="notice notice--warning" role="status">
            <strong>Ya existe un cliente con este documento.</strong> Revisar
            registro existente antes de continuar. Podés continuar si, luego de
            revisarlo, corresponde crear otro registro.
            <div className="mt-2">
              <Link to={`/app/clientes/${duplicateClient.id}/editar`}>
                Abrir registro de{" "}
                {duplicateClient.razonSocial ||
                  `${duplicateClient.nombre} ${duplicateClient.apellido ?? ""}`.trim()}
              </Link>
            </div>
          </div>
        )}
        <div className="form-actions">
          <Link className="button button--secondary" to="/app/clientes">
            Cancelar
          </Link>
          <button className="button" disabled={isSubmitting}>
            {isSubmitting ? "Guardando…" : "Guardar cliente"}
          </button>
        </div>
      </form>
    </>
  );
}
