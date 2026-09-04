import { Plus, Pencil, UserX } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usuarioService } from "../../../services/api";
import type { Usuario } from "../../../types/usuario.types";
import { DataTable, type Column } from "../../../shared/tables/DataTable";
import { LoadingState } from "../../../shared/feedback/LoadingState";
import { EmptyState } from "../../../shared/feedback/EmptyState";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { StatusBadge } from "../../../shared/ui/StatusBadge";
import { useToast } from "../../../shared/feedback/useToast";
import { errorMessage } from "../../../utils/errorMessage";

const roles = (u: Usuario) => u.roles.join(", ");

export default function UsuariosPage() {
  const [rows, setRows] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const { show } = useToast();

  const load = () => {
    setLoading(true);
    usuarioService
      .list()
      .then(setRows)
      .catch((e) => show(errorMessage(e), "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;

    usuarioService
      .list()
      .then((data) => {
        if (!cancelled) {
          setRows(data);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          show(errorMessage(error), "error");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [show]);

  const cols: Column<Usuario>[] = [
    {
      key: "user",
      header: "Usuario",
      cell: (r) => (
        <>
          <strong>{r.nombre}</strong>
          <small className="muted" style={{ display: "block" }}>
            @{r.username}
          </small>
        </>
      ),
    },
    { key: "email", header: "Email", cell: (r) => r.email },
    { key: "roles", header: "Roles", cell: (r) => roles(r) },
    {
      key: "state",
      header: "Estado",
      cell: (r) => <StatusBadge value={r.activo} />,
    },
    {
      key: "a",
      header: "Acciones",
      cell: (r) => (
        <div className="actions-row">
          <Link
            className="button button--secondary"
            to={`/app/usuarios/${r.id}/editar`}
          >
            <Pencil size={16} />
            Editar
          </Link>
          {r.activo && (
            <button
              className="button button--danger"
              onClick={async () => {
                if (!confirm(`¿Desactivar a ${r.username}?`)) return;
                try {
                  await usuarioService.deactivate(r.id);
                  show("Usuario desactivado.", "success");
                  load();
                } catch (e) {
                  show(errorMessage(e), "error");
                }
              }}
            >
              <UserX size={16} />
              Desactivar
            </button>
          )}
        </div>
      ),
    },
  ];
  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Administración de cuentas internas, roles y bajas lógicas."
        actions={
          <Link className="button" to="/app/usuarios/nuevo">
            <Plus size={17} />
            Nuevo usuario
          </Link>
        }
      />
      {loading ? (
        <LoadingState />
      ) : rows.length ? (
        <DataTable rows={rows} columns={cols} keyOf={(r) => r.id} />
      ) : (
        <EmptyState title="No hay usuarios" />
      )}
    </>
  );
}
