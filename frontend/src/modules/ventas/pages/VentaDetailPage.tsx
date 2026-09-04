import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MANAGEMENT_ROLES, hasAnyRole } from "../../../config/permissions";
import { useAuth } from "../../../hooks/useAuth";
import { ventaService } from "../../../services/api";
import type { Venta } from "../../../types/domain.types";
import { LoadingState } from "../../../shared/feedback/LoadingState";
import { ErrorState } from "../../../shared/feedback/ErrorState";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { DownloadButton } from "../../../shared/components/DownloadButton";
import { formatCurrency } from "../../../utils/formatCurrency";
import { formatDate } from "../../../utils/formatDate";
import { errorMessage } from "../../../utils/errorMessage";

export default function VentaDetailPage() {
  const id = Number(useParams().id);
  const validId = Number.isInteger(id) && id > 0;
  const { session } = useAuth();
  const management = hasAnyRole(session?.roles ?? [], MANAGEMENT_ROLES);
  const [sale, setSale] = useState<Venta | null>(null);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    if (!validId) return;

    setLoading(true);
    setError("");

    try {
      const saleData = await ventaService.get(id);
      setSale(saleData);

      if (management) {
        try {
          const managementDetail = await ventaService.gerencial(id);
          setDetail(managementDetail as Record<string, unknown>);
        } catch {
          setDetail(null);
        }
      }
    } catch (e) {
      setError(errorMessage(e));
      setSale(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!validId) return;

    let cancelled = false;

    ventaService
      .get(id)
      .then((data) => {
        if (!cancelled) {
          setSale(data);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setError(errorMessage(error));
          setSale(null);
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
  }, [id, validId]);

  useEffect(() => {
    if (!validId || !management) return;

    let cancelled = false;

    ventaService
      .gerencial(id)
      .then((data) => {
        if (!cancelled) {
          setDetail(data as Record<string, unknown>);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDetail(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, validId, management]);

  if (!validId) {
    return (
      <ErrorState
        title="No pudimos abrir la venta"
        description="El identificador de venta no es válido."
      />
    );
  }

  if (loading) {
    return <LoadingState label="Cargando venta…" />;
  }

  if (error || !sale) {
    return (
      <ErrorState
        title="No pudimos abrir la venta"
        description={error || "La venta no está disponible."}
        onRetry={() => void load()}
      />
    );
  }

  return (
    <>
      <PageHeader
        title={`Venta #${sale.id}`}
        description={`Registrada el ${formatDate(sale.fechaVenta)}`}
        actions={
          <>
            <Link className="button button--secondary" to="/app/ventas">
              Volver
            </Link>
            <DownloadButton
              load={() => ventaService.receipt(id)}
              filename={`venta-${id}.pdf`}
              label="Descargar comprobante"
            />
          </>
        }
      />
      <div className="grid grid--2">
        <section className="card">
          <h2>Operación</h2>
          <div className="detail-list">
            <Detail
              label="Vehículo"
              value={sale.vehiculo || `ID ${sale.vehiculoId}`}
            />
            <Detail
              label="Cliente comprador"
              value={sale.clienteComprador || `ID ${sale.clienteCompradorId}`}
            />
            <Detail
              label="Precio final"
              value={formatCurrency(sale.precioFinal)}
            />
            <Detail label="Fecha" value={formatDate(sale.fechaVenta)} />
            {sale.vendedor && <Detail label="Vendedor" value={sale.vendedor} />}
          </div>
          {sale.observaciones && (
            <p style={{ marginTop: 16 }}>{sale.observaciones}</p>
          )}
        </section>
        {management && (
          <section className="card">
            <h2>Detalle gerencial</h2>
            {detail ? (
              <div className="detail-list">
                {Object.entries(detail)
                  .filter(([, v]) => typeof v !== "object")
                  .map(([k, v]) => (
                    <Detail
                      key={k}
                      label={k.replaceAll("_", " ")}
                      value={
                        typeof v === "number"
                          ? formatCurrency(v)
                          : String(v ?? "—")
                      }
                    />
                  ))}
              </div>
            ) : (
              <p className="muted">No hay detalle gerencial disponible.</p>
            )}
          </section>
        )}
      </div>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-item">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}
