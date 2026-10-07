import { useEffect, useState } from "react";
import { costoService, vehiculoService } from "../../../services/api";
import type { CostosVehiculo } from "../../../types/domain.types";
import type { Vehiculo } from "../../../types/vehiculo.types";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { LoadingState } from "../../../shared/feedback/LoadingState";
import { formatCurrency } from "../../../utils/formatCurrency";
import { useToast } from "../../../shared/feedback/useToast";
import { errorMessage } from "../../../utils/errorMessage";

export default function CostosPage() {
  const [rows, setRows] = useState<
    Array<{ vehicle: Vehiculo; cost: CostosVehiculo | null }>
  >([]);
  const [loading, setLoading] = useState(true);
  const { show } = useToast();

  useEffect(() => {
    vehiculoService
      .list()
      .then(async (vehicles) => {
        const active = vehicles.filter((v) => v.activo);
        const costs = await Promise.all(
          active.map((v) =>
            costoService
              .get(v.id)
              .then((cost) => ({ vehicle: v, cost }))
              .catch(() => ({ vehicle: v, cost: null })),
          ),
        );
        setRows(costs);
      })
      .catch((e) => show(errorMessage(e, "No pudimos cargar los costos de los vehículos."), "error"))
      .finally(() => setLoading(false));
  }, [show]);
  
  return (
    <>
      <PageHeader
        title="Costos y rentabilidad"
        description="Vista reservada a Dueño/Administrador. Los costos y la rentabilidad se calculan automáticamente a partir de la información registrada."
      />
      {loading ? (
        <LoadingState />
      ) : (
        <div className="grid">
          {rows.map(({ vehicle, cost }) => (
            <article className="card" key={vehicle.id}>
              <div className="section-title">
                <div>
                  <h2>
                    {vehicle.marca} {vehicle.modelo}
                  </h2>
                  <p>
                    {vehicle.anio} · {vehicle.matricula}
                  </p>
                </div>
                <strong>{vehicle.estado.replaceAll("_", " ")}</strong>
              </div>
              {cost ? (
                <div className="detail-list">
                  <Item
                    label="Costo de compra"
                    value={formatCurrency(Number(cost.costoCompra ?? 0))}
                  />
                  <Item
                    label="Refacciones"
                    value={formatCurrency(Number(cost.costoRefacciones ?? 0))}
                  />
                  <Item
                    label="Costo total"
                    value={formatCurrency(Number(cost.costoTotal ?? 0))}
                  />
                  {cost.historicoCerrado && cost.precioVentaFinal != null && (
                    <Item
                      label="Precio final de venta"
                      value={formatCurrency(Number(cost.precioVentaFinal))}
                    />
                  )}
                  {cost.historicoCerrado && cost.rentabilidad != null && (
                    <Item
                      label="Rentabilidad de la venta"
                      value={formatCurrency(Number(cost.rentabilidad))}
                    />
                  )}
                </div>
              ) : (
                <p className="muted">
                  Sin cálculo disponible. Normalmente ocurre antes de registrar
                  la compra.
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-item">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}
