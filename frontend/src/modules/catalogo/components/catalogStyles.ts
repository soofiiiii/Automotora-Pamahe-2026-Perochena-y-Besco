export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const fieldControl =
  "w-full rounded-lg border border-brand/15 bg-white px-3.5 text-brand-deep outline-none transition-[border-color,box-shadow] placeholder:text-brand-deep/70 hover:border-brand/35 focus:border-brand focus:ring-3 focus:ring-brand/10 disabled:cursor-not-allowed disabled:bg-brand/[0.035] disabled:text-brand-deep/45";

export const fieldLabel =
  "text-[12px] font-extrabold uppercase tracking-[0.08em] text-brand-deep/70";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 font-bold text-white transition-[transform,background-color] hover:bg-brand-deep active:scale-[0.98]";

export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-brand/20 bg-white px-4 font-bold text-brand transition-[transform,border-color,background-color] hover:border-brand hover:bg-brand/[0.04] active:scale-[0.98]";
