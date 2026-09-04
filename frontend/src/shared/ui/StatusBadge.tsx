export function StatusBadge({
  value,
}: {
  value: string | boolean | undefined | null;
}) {
  const text =
    typeof value === "boolean"
      ? value
        ? "Activo"
        : "Inactivo"
      : (value ?? "—").toString().replaceAll("_", " ");
  return (
    <span
      className={`status status--${text.toLowerCase().replaceAll(" ", "-")}`}
    >
      {text}
    </span>
  );
}
