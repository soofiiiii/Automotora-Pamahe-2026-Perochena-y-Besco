import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
}

export function DataTable<T>({
  rows,
  columns,
  keyOf,
  caption,
}: {
  rows: T[];
  columns: Column<T>[];
  keyOf: (row: T) => string | number;
  caption?: string;
}) {
  return (
    <div className="table-wrap" tabIndex={0} aria-label={caption ?? "Tabla de datos"}>
      <table>
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((c) => (
              <th scope="col" key={c.key}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={keyOf(r)}>
              {columns.map((c) => (
                <td key={c.key}>{c.cell(r)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
