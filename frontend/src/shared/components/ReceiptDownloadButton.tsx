import { compraService, ventaService } from "../../services/api";
import { DownloadButton } from "./DownloadButton";

type ReceiptKind = "compra" | "venta";

const CONFIG = {
  compra: {
    load: compraService.receipt,
    filenamePrefix: "comprobante-compra",
    operationLabel: "compra",
  },
  venta: {
    load: ventaService.receipt,
    filenamePrefix: "comprobante-venta",
    operationLabel: "venta",
  },
} satisfies Record<
  ReceiptKind,
  {
    load: (id: number) => Promise<Blob>;
    filenamePrefix: string;
    operationLabel: string;
  }
>;

export function ReceiptDownloadButton({
  kind,
  operationId,
  compact = false,
}: {
  kind: ReceiptKind;
  operationId: number;
  compact?: boolean;
}) {
  const config = CONFIG[kind];

  return (
    <DownloadButton
      load={() => config.load(operationId)}
      filename={`${config.filenamePrefix}-${operationId}.pdf`}
      label={compact ? "PDF" : "Descargar comprobante"}
      ariaLabel={`Descargar comprobante PDF de ${config.operationLabel} ${operationId}`}
      errorFallback={`No se pudo descargar el comprobante PDF de la ${config.operationLabel}.`}
    />
  );
}
