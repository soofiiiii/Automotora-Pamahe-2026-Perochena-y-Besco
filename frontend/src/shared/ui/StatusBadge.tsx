const toneByStatus: Record<string, string> = {
  DISPONIBLE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  FINALIZADA: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  ACTIVO: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  EN_TALLER: "bg-amber-50 text-amber-800 ring-amber-200",
  EN_CURSO: "bg-amber-50 text-amber-800 ring-amber-200",
  RESERVADO: "bg-amber-50 text-amber-800 ring-amber-200",
  PENDIENTE: "bg-sky-50 text-sky-700 ring-sky-200",
  COMPRADO: "bg-sky-50 text-sky-700 ring-sky-200",
  VENDIDO: "bg-blue-50 text-blue-700 ring-blue-200",
  DADO_DE_BAJA: "bg-rose-50 text-rose-700 ring-rose-200",
  INACTIVO: "bg-rose-50 text-rose-700 ring-rose-200",
};

export function StatusBadge({
  value,
}: {
  value: string | boolean | undefined | null;
}) {
  const raw =
    typeof value === "boolean"
      ? value
        ? "ACTIVO"
        : "INACTIVO"
      : (value ?? "—").toString();
  const text = raw.replaceAll("_", " ");
  const tone = toneByStatus[raw.toUpperCase()] ?? "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <span
      className={`status inline-flex items-center rounded-full px-2.5 py-1 text-[0.7rem] font-extrabold capitalize tracking-[-0.01em] ring-1 ring-inset ${tone}`}
    >
      {text.toLowerCase().replace(/^./, (value) => value.toUpperCase())}
    </span>
  );
}
