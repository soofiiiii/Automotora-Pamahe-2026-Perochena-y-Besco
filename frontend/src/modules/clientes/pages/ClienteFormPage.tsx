import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { clienteService } from "../../../services/api";
import { FormField } from "../../../shared/forms/FormField";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { useToast } from "../../../shared/feedback/useToast";
import { errorMessage } from "../../../utils/errorMessage";

const schema = z.object({
  nombre: z.string().trim().min(1, "Obligatorio").max(100),
  apellido: z.string().trim().max(100).optional(),
  razonSocial: z.string().trim().max(150).optional(),
  documento: z.string().trim().min(5, "Documento inválido").max(30),
  telefono: z.string().trim().max(30).optional(),
  email: z
    .union([z.string().trim().email("Email inválido").max(120), z.literal("")])
    .optional(),
  direccion: z.string().trim().max(180).optional(),
  tipoCliente: z.enum(["COMPRADOR", "VENDEDOR", "AMBOS"]),
});

type Values = z.infer<typeof schema>;

export default function ClienteFormPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { show } = useToast();

  const {
    register,
    handleSubmit,
    reset,
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
        .catch((e) => show(errorMessage(e), "error"));
  }, [id, reset, show]);
  
  return (
    <>
      <PageHeader
        title={id ? "Editar cliente" : "Nuevo cliente"}
        description="Los clientes quedan disponibles para asociarlos a compras y ventas según su tipo comercial."
      />
      <form
        className="card"
        onSubmit={handleSubmit(async (v) => {
          try {
            const body = {
              ...v,
              telefono: v.telefono || undefined,
              email: v.email || undefined,
            };
            if (id) await clienteService.update(Number(id), body);
            else await clienteService.create(body);
            show("Cliente guardado.", "success");
            nav("/app/clientes");
          } catch (e) {
            show(errorMessage(e), "error");
          }
        })}
      >
        <div className="notice privacy-form-notice">
          Registrá únicamente los datos necesarios para la relación comercial. Verificá que la persona conozca la finalidad del tratamiento y evitá observaciones con información sensible innecesaria.
        </div>
        <div className="form-grid">
          <FormField label="Nombre" error={errors.nombre?.message}>
            <input autoComplete="given-name" {...register("nombre")} />
          </FormField>
          <FormField label="Apellido">
            <input autoComplete="family-name" {...register("apellido")} />
          </FormField>
          <FormField label="Razón social">
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
          <FormField label="Dirección">
            <input autoComplete="street-address" {...register("direccion")} />
          </FormField>
          <FormField label="Tipo">
            <select {...register("tipoCliente")}>
              <option value="COMPRADOR">Comprador</option>
              <option value="VENDEDOR">Vendedor</option>
              <option value="AMBOS">Ambos</option>
            </select>
          </FormField>
        </div>
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
