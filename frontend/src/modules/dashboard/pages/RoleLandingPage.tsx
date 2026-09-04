import { ArrowRight, BarChart3, Car, Contact, Wrench } from "lucide-react";
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
        description="Accesos rápidos según tu perfil. Los permisos visibles en la interfaz acompañan las restricciones de la API."
      />
      <div className="grid grid--3">
        {hasAnyRole(roles, MANAGEMENT_ROLES) && (
          <Link className="card module-card" to="/app/dashboard">
            <BarChart3 />
            <h2>Dashboard</h2>
            <p>Indicadores gerenciales y situación general del negocio.</p>
            <span>
              Ver indicadores <ArrowRight size={16} />
            </span>
          </Link>
        )}
        <Link className="card module-card" to="/app/vehiculos">
          <Car />
          <h2>Vehículos</h2>
          <p>Stock, estados y detalle operativo de cada unidad.</p>
          <span>
            Abrir inventario <ArrowRight size={16} />
          </span>
        </Link>
        {hasAnyRole(roles, COMMERCIAL_ROLES) && (
          <Link className="card module-card" to="/app/clientes">
            <Contact />
            <h2>Gestión comercial</h2>
            <p>Clientes, compras y ventas conectados al inventario.</p>
            <span>
              Ir a clientes <ArrowRight size={16} />
            </span>
          </Link>
        )}
        {hasAnyRole(roles, WORKSHOP_ROLES) && (
          <Link className="card module-card" to="/app/taller">
            <Wrench />
            <h2>Taller</h2>
            <p>Refacciones, costos de trabajo y cola offline.</p>
            <span>
              Abrir taller <ArrowRight size={16} />
            </span>
          </Link>
        )}
      </div>
    </>
  );
}
