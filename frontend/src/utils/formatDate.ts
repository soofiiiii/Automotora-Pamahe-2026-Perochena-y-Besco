export const formatDate = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("es-UY").format(
        new Date(`${value.length === 10 ? `${value}T12:00:00` : value}`),
      )
    : "—";
export const todayIso = () => new Date().toISOString().slice(0, 10);
