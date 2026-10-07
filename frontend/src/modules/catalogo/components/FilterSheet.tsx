import { useEffect, useRef, type RefObject } from "react";
import { X } from "lucide-react";
import { type CatalogFilterState } from "../hooks/useCatalogFilters";
import { btnGhost, btnPrimary, cx } from "./catalogStyles";
import { FilterFields } from "./FilterFields";

export const CATALOG_FILTER_DIALOG_ID = "catalog-filter-dialog";

const CATALOG_FILTER_TITLE_ID = "catalog-filter-title";

export function FilterSheet({
  open,
  onClose,
  state,
  returnFocusRef,
}: {
  open: boolean;
  onClose: () => void;
  state: CatalogFilterState;
  returnFocusRef?: RefObject<HTMLButtonElement | null>;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousOverflow;
    };
  }, [open]);

  const requestClose = () => {
    const dialog = ref.current;

    if (dialog?.open) {
      dialog.close();
    }
  };

  const handleClose = () => {
    onClose();
    returnFocusRef?.current?.focus();
  };

  const count = state.resultCount;

  return (
    <dialog
      id={CATALOG_FILTER_DIALOG_ID}
      ref={ref}
      onClose={handleClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          requestClose();
        }
      }}
      aria-modal="true"
      aria-labelledby={CATALOG_FILTER_TITLE_ID}
      className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[90dvh] w-full max-w-none rounded-t-2xl border-0 bg-paper p-0 text-brand-deep open:animate-sheet-up backdrop:bg-brand-deep/65 backdrop:backdrop-blur-sm lg:hidden"
    >
      {open && (
        <div className="flex max-h-[90dvh] flex-col">
          <div className="flex items-center justify-between border-b border-brand/10 bg-white px-5 py-4">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-brand">
                Catálogo
              </span>

              <h2
                id={CATALOG_FILTER_TITLE_ID}
                className="m-0 mt-0.5 text-xl font-black tracking-tight"
              >
                Filtrar vehículos
              </h2>
            </div>

            <button
              type="button"
              onClick={requestClose}
              aria-label="Cerrar filtros"
              className="inline-grid size-11 place-items-center rounded-lg border border-brand/15 text-brand"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>

          <div className="overflow-y-auto overscroll-contain px-5 py-5">
            <fieldset className="mb-6 border-0 border-b border-brand/10 p-0 pb-5">
              <legend className="mb-3 text-[12px] font-extrabold uppercase tracking-[0.08em] text-brand-deep/65">
                Tipo de vehículo
              </legend>

              <div className="grid grid-cols-2 gap-2">
                <label className="flex min-h-11 cursor-pointer items-center justify-between border border-brand/15 bg-white px-3 text-sm font-bold">
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="tipo-mobile"
                      checked={state.filters.tipo === ""}
                      onChange={() => state.patch({ tipo: "" })}
                      className="accent-brand"
                    />
                    Todos
                  </span>
                </label>

                {state.vehicleTypes.map((type) => (
                  <label
                    key={type.value}
                    className="flex min-h-11 cursor-pointer items-center justify-between border border-brand/15 bg-white px-3 text-sm font-bold"
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="tipo-mobile"
                        checked={state.filters.tipo === type.value}
                        onChange={() => state.patch({ tipo: type.value })}
                        className="accent-brand"
                      />
                      {type.label}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <FilterFields state={state} layout="stack" />
          </div>

          <div
            className="grid grid-cols-[auto_1fr] gap-3 border-t border-brand/10 bg-white px-5 pt-4"
            style={{
              paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
            }}
          >
            <button
              type="button"
              onClick={state.reset}
              className={cx(btnGhost, "h-12")}
            >
              Limpiar
            </button>

            <button
              type="button"
              onClick={requestClose}
              className={cx(btnPrimary, "h-12")}
            >
              Ver {count} {count === 1 ? "vehículo" : "vehículos"}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
