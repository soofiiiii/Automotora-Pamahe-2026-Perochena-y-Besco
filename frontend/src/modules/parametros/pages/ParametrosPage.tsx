import { Pencil, Plus, Power, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { parametroService } from "../../../services/api";
import { EmptyState } from "../../../shared/feedback/EmptyState";
import { LoadingState } from "../../../shared/feedback/LoadingState";
import { useToast } from "../../../shared/feedback/useToast";
import { useConfirmDialog } from "../../../shared/feedback/useConfirmDialog";
import { FormField } from "../../../shared/forms/FormField";
import { PageHeader } from "../../../shared/ui/PageHeader";
import type { Parametro, ParametroRequest } from "../../../types/domain.types";
import { errorMessage } from "../../../utils/errorMessage";

const EMPTY_FORM: ParametroRequest = {
  categoria: "",
  clave: "",
  valor: "",
  descripcion: "",
};

type FieldErrors = Partial<Record<keyof ParametroRequest, string>>;

export default function ParametrosPage() {
  const [rows, setRows] = useState<Parametro[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Parametro | null>(null);
  const [form, setForm] = useState<ParametroRequest>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const { show } = useToast();
  const { confirm } = useConfirmDialog();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setRows(await parametroService.list());
    } catch (error) {
      show(errorMessage(error, "No pudimos completar la operación con los parámetros."), "error");
    } finally {
      setLoading(false);
    }
  }, [show]);

  useEffect(() => {
    let active = true;

    parametroService
      .list()
      .then(
        (result) => {
          if (active) setRows(result);
        },
        (cause) => {
          if (active) show(errorMessage(cause, "No pudimos cargar los parámetros."), "error");
        },
      )
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [show]);

  const resetDialog = useCallback(() => {
    setShowForm(false);
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setErrors({});
  }, []);

  const closeForm = useCallback(() => {
    if (!saving) resetDialog();
  }, [resetDialog, saving]);

  useEffect(() => {
    if (!showForm) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    window.requestAnimationFrame(() => firstFieldRef.current?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) closeForm();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.requestAnimationFrame(() => previousFocus?.focus());
    };
  }, [closeForm, saving, showForm]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (parametro: Parametro) => {
    setEditing(parametro);
    setForm({
      categoria: parametro.categoria,
      clave: parametro.clave,
      valor: parametro.valor,
      descripcion: parametro.descripcion ?? "",
    });
    setErrors({});
    setShowForm(true);
  };

  const setField = (field: keyof ParametroRequest, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const next: FieldErrors = {};
    const categoria = form.categoria.trim();
    const clave = form.clave.trim();
    const valor = form.valor.trim();
    const descripcion = form.descripcion?.trim() ?? "";

    if (!categoria) next.categoria = "La categoría es obligatoria.";
    else if (categoria.length > 80)
      next.categoria = "La categoría no puede superar los 80 caracteres.";

    if (!clave) next.clave = "La clave es obligatoria.";
    else if (clave.length > 80)
      next.clave = "La clave no puede superar los 80 caracteres.";

    if (!valor) next.valor = "El valor es obligatorio.";
    else if (valor.length > 500)
      next.valor = "El valor no puede superar los 500 caracteres.";

    if (descripcion.length > 300)
      next.descripcion = "La descripción no puede superar los 300 caracteres.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    const body: ParametroRequest = {
      categoria: form.categoria.trim(),
      clave: form.clave.trim(),
      valor: form.valor.trim(),
      descripcion: form.descripcion?.trim() || undefined,
    };

    try {
      setSaving(true);
      if (editing) {
        await parametroService.update(editing.id, body);
        show("Parámetro actualizado correctamente.", "success");
      } else {
        await parametroService.create(body);
        show("Parámetro creado correctamente.", "success");
      }
      resetDialog();
      await load();
    } catch (error) {
      show(errorMessage(error, "No pudimos completar la operación con los parámetros."), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (parametro: Parametro) => {
    const confirmed = await confirm({
      title: "Desactivar parámetro",
      message: `El parámetro "${parametro.clave}" dejará de estar disponible para nuevas selecciones. Los registros históricos conservarán su valor.`,
      confirmLabel: "Continuar con la desactivación",
      secondConfirmLabel: "Sí, desactivar parámetro",
    });
    if (!confirmed) return;

    try {
      await parametroService.deactivate(parametro.id);
      show("Parámetro desactivado correctamente.", "success");
      await load();
    } catch (error) {
      show(errorMessage(error, "No pudimos completar la operación con los parámetros."), "error");
    }
  };

  return (
    <>
      <PageHeader
        title="Parámetros"
        description="Administración de marcas, tipos, estados y demás valores configurables del sistema."
        actions={
          <button type="button" className="button" onClick={openCreate}>
            <Plus size={17} aria-hidden="true" />
            Nuevo parámetro
          </button>
        }
      />

      {loading ? (
        <LoadingState />
      ) : rows.length ? (
        <div className="grid grid--3">
          {rows.map((parametro) => (
            <article className="card" key={parametro.id}>
              <div className="parameter-card__header">
                <div>
                  <small className="muted">{parametro.categoria}</small>
                  <h2>{parametro.valor}</h2>
                  <strong>{parametro.clave}</strong>
                </div>
                <span
                  className={
                    parametro.activo
                      ? "status status--success"
                      : "status status--neutral"
                  }
                >
                  {parametro.activo ? "Activo" : "Inactivo"}
                </span>
              </div>

              {parametro.descripcion && (
                <p className="muted">{parametro.descripcion}</p>
              )}

              <div className="actions-row parameter-card__actions">
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => openEdit(parametro)}
                >
                  <Pencil size={16} aria-hidden="true" />
                  Editar
                </button>
                {parametro.activo && (
                  <button
                    type="button"
                    className="button button--danger"
                    onClick={() => void handleDeactivate(parametro)}
                  >
                    <Power size={16} aria-hidden="true" />
                    Desactivar
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No hay parámetros para mostrar" />
      )}

      {showForm && (
        <div className="modal-backdrop">
          <section
            className="card modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="parameter-dialog-title"
          >
            <div className="modal-card__header">
              <h2 id="parameter-dialog-title">
                {editing ? "Editar parámetro" : "Nuevo parámetro"}
              </h2>
              <button
                type="button"
                className="icon-button"
                onClick={closeForm}
                disabled={saving}
                aria-label="Cerrar formulario de parámetro"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid" noValidate>
              <FormField label="Categoría *" error={errors.categoria}>
                <input
                  ref={firstFieldRef}
                  type="text"
                  value={form.categoria}
                  maxLength={80}
                  aria-invalid={Boolean(errors.categoria)}
                  onChange={(event) =>
                    setField("categoria", event.target.value)
                  }
                />
              </FormField>

              <FormField label="Clave *" error={errors.clave}>
                <input
                  type="text"
                  value={form.clave}
                  maxLength={80}
                  aria-invalid={Boolean(errors.clave)}
                  onChange={(event) => setField("clave", event.target.value)}
                />
              </FormField>

              <FormField label="Valor *" error={errors.valor}>
                <textarea
                  value={form.valor}
                  maxLength={500}
                  rows={4}
                  aria-invalid={Boolean(errors.valor)}
                  onChange={(event) => setField("valor", event.target.value)}
                />
              </FormField>

              <FormField label="Descripción" error={errors.descripcion}>
                <textarea
                  value={form.descripcion ?? ""}
                  maxLength={300}
                  rows={3}
                  aria-invalid={Boolean(errors.descripcion)}
                  onChange={(event) =>
                    setField("descripcion", event.target.value)
                  }
                />
              </FormField>

              <div className="form-actions">
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button type="submit" className="button" disabled={saving}>
                  {saving
                    ? "Guardando…"
                    : editing
                      ? "Guardar cambios"
                      : "Crear parámetro"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}