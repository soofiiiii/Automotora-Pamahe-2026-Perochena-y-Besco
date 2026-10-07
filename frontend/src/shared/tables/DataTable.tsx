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
    <div
      className="table-wrap scrollbar-none max-w-full overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]"
      tabIndex={0}
      aria-label={caption ?? "Tabla de datos"}
    >
      <table className="min-w-[720px] w-full border-collapse text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="bg-slate-50/90">
            {columns.map((c) => (
              <th
                scope="col"
                key={c.key}
                className="border-b border-slate-200 px-4 py-3.5 text-left text-[0.68rem] font-black uppercase tracking-[0.1em] text-slate-500"
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr
              key={keyOf(r)}
              className="transition-colors hover:bg-brand/[0.025]"
            >
              {columns.map((c) => (
                <td key={c.key} className="px-4 py-3.5 align-middle text-slate-700">
                  {c.cell(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
