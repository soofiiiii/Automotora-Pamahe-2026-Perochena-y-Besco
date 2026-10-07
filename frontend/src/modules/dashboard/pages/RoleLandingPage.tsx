import {
  ArrowRight,
  BarChart3,
  Car,
  Contact,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  COMMERCIAL_ROLES,
  MANAGEMENT_ROLES,
  WORKSHOP_ROLES,
  hasAnyRole,
} from "../../../config/permissions";
import { useAuth } from "../../../hooks/useAuth";
import { PageHeader } from "../../../shared/ui/PageHeader";

export default function RoleLandingPage() {
  const { session } = useAuth();
  const roles = session?.roles ?? [];

  return (
    <>
      <PageHeader
        title={`Hola, ${session?.nombre || session?.username}`}
        description="Accedé rápidamente a los módulos habilitados para tu perfil y continuá la operativa desde un único lugar."
      />

      <section className="mb-6 overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#1d3273_0%,#16275f_55%,#101936_100%)] p-5 text-white shadow-[0_18px_40px_rgba(29,50,115,0.22)] sm:p-6 lg:p-8">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.12em] text-sun ring-1 ring-inset ring-white/10">
              <ShieldCheck className="size-3.5" /> Sesión protegida
            </span>
            <h2 className="mb-2 mt-4 text-2xl font-black tracking-[-0.035em] sm:text-3xl">
              Panel operativo de Automotora Pamahe
            </h2>
            <p className="mb-0 max-w-xl text-sm leading-6 text-white/65 sm:text-base">
              Los accesos se muestran de acuerdo con tus permisos. La información sensible permanece restringida a los perfiles autorizados.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex lg:grid">
            <div className="rounded-2xl bg-white/[0.07] px-4 py-3 ring-1 ring-inset ring-white/10">
              <small className="block text-[0.65rem] font-bold uppercase tracking-[0.1em] text-white/40">Usuario</small>
              <strong className="mt-1 block max-w-40 truncate text-sm">{session?.username}</strong>
            </div>
            <div className="rounded-2xl bg-white/[0.07] px-4 py-3 ring-1 ring-inset ring-white/10">
              <small className="block text-[0.65rem] font-bold uppercase tracking-[0.1em] text-white/40">Perfiles</small>
              <strong className="mt-1 block max-w-48 truncate text-sm">{roles.join(" · ")}</strong>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {hasAnyRole(roles, MANAGEMENT_ROLES) && (
          <ModuleLink
            to="/app/dashboard"
            icon={<BarChart3 />}
            eyebrow="Gestión"
            title="Dashboard"
            description="Indicadores gerenciales, actividad comercial y situación general del negocio."
            action="Ver indicadores"
          />
        )}
        <ModuleLink
          to="/app/vehiculos"
          icon={<Car />}
          eyebrow="Inventario"
          title="Vehículos"
          description="Stock, estados y detalle operativo de cada unidad registrada."
          action="Abrir inventario"
        />
        {hasAnyRole(roles, COMMERCIAL_ROLES) && (
          <ModuleLink
            to="/app/clientes"
            icon={<Contact />}
            eyebrow="Comercial"
            title="Clientes"
            description="Personas vinculadas a compras y ventas, con sus datos de contacto."
            action="Gestionar clientes"
          />
        )}
        {hasAnyRole(roles, WORKSHOP_ROLES) && (
          <ModuleLink
            to="/app/taller"
            icon={<Wrench />}
            eyebrow="Operación"
            title="Taller"
            description="Refacciones, costos de trabajo y operaciones pendientes de sincronización."
            action="Abrir taller"
          />
        )}
      </div>
    </>
  );
}

function ModuleLink({
  to,
  icon,
  eyebrow,
  title,
  description,
  action,
}: {
  to: string;
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  action: string;
}) {
  return (
    <Link
      to={to}
      className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-1 hover:border-brand/20 hover:shadow-[0_18px_38px_rgba(29,50,115,0.11)]"
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-brand/10 text-brand transition-colors group-hover:bg-brand group-hover:text-white [&>svg]:size-5">
          {icon}
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-[0.12em] text-slate-500">
          {eyebrow}
        </span>
      </div>
      <h2 className="m-0 text-xl font-black tracking-[-0.03em] text-slate-950">{title}</h2>
      <p className="mb-5 mt-2 min-h-12 text-sm leading-6 text-slate-500">{description}</p>
      <span className="inline-flex items-center gap-2 text-sm font-extrabold text-brand">
        {action}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
      </span>
      <span className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-sun transition-transform duration-200 group-hover:scale-x-100" />
    </Link>
  );
}
