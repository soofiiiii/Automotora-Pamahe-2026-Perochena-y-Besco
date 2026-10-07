import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-slate-200/80 pb-5 sm:mb-7 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <div className="mb-2 flex items-center gap-2 text-[0.66rem] font-black uppercase tracking-[0.16em] text-brand/70">
          <span className="h-1.5 w-1.5 rounded-full bg-sun shadow-[0_0_0_4px_rgba(242,210,46,0.18)]" />
          Gestión interna
        </div>
        <h1 className="m-0 text-[clamp(1.65rem,3vw,2.25rem)] font-black tracking-[-0.04em] text-slate-950">
          {title}
        </h1>
        {description && (
          <p className="mb-0 mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-600 sm:text-[0.95rem]">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          {actions}
        </div>
      )}
    </header>
  );
}
