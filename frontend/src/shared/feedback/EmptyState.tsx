import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="state-card min-h-56 rounded-2xl border border-dashed border-slate-300 bg-white/80 p-8 text-center shadow-sm">
      <span className="grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
        <Inbox className="size-6" aria-hidden="true" />
      </span>
      <strong className="text-base font-extrabold text-slate-800">{title}</strong>
      {description && <p className="m-0 max-w-xl text-sm leading-6 text-slate-500">{description}</p>}
      {action}
    </div>
  );
}
