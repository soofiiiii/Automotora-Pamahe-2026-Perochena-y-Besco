import { Download, FileSpreadsheet } from "lucide-react";
import { exportService } from "../../../services/api";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { useToast } from "../../../shared/feedback/useToast";

const exports = [
  {
    key: "vehiculos" as const,
    label: "Vehículos",
    description: "Listado del inventario administrado por el sistema.",
  },
  {
    key: "clientes" as const,
    label: "Clientes",
    description: "Datos operativos de compradores y vendedores.",
  },
  {
    key: "ventas" as const,
    label: "Ventas",
    description: "Operaciones comerciales registradas.",
  },
];

export default function ReportesPage() {
  const { show } = useToast();
  const download = async (key: "vehiculos" | "clientes" | "ventas") => {
    try {
      const blob = await exportService.file(key);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${key}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      show("No se pudo generar la exportación.", "error");
    }
  };
  
  return (
    <>
      <PageHeader
        title="Reportes y exportaciones"
        description="La versión actual consume únicamente las exportaciones que ya existen en el backend."
      />
      <div className="grid grid--3">
        {exports.map((e) => (
          <article className="card module-card" key={e.key}>
            <FileSpreadsheet />
            <h2>{e.label}</h2>
            <p>{e.description}</p>
            <button
              className="button button--secondary"
              onClick={() => download(e.key)}
            >
              <Download size={17} />
              Descargar CSV
            </button>
          </article>
        ))}
      </div>
    </>
  );
}
