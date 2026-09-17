import { useEffect, useState } from "react";
import { Pencil, Plus, Power, X } from "lucide-react";
import { parametroService } from "../../../services/api";
import type {Parametro, ParametroRequest,} from "../../../types/domain.types";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { LoadingState } from "../../../shared/feedback/LoadingState";
import { EmptyState } from "../../../shared/feedback/EmptyState";
import { useToast } from "../../../shared/feedback/useToast";
import { errorMessage } from "../../../utils/errorMessage";

const EMPTY_FORM: ParametroRequest = {
  categoria: "",
  clave: "",
  valor: "",
  descripcion: "",
};

export default function ParametrosPage() {
  const [rows, setRows] =
    useState<Parametro[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [showForm, setShowForm] =
    useState(false);

  const [editing, setEditing] =
    useState<Parametro | null>(null);

  const [form, setForm] =
    useState<ParametroRequest>(EMPTY_FORM);

  const [errors, setErrors] =
    useState<Record<string, string>>({});

  const { show } = useToast();


  const load = async () => {
    try {
      setLoading(true);
      const data =
        await parametroService.list();
      setRows(data);
    } catch (error) {
      show(
        errorMessage(error),
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);


  const openCreate = () => {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
    });
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (
    parametro: Parametro
  ) => {
    setEditing(parametro);
    setForm({
      categoria:
        parametro.categoria,
      clave:
        parametro.clave,
      valor:
        parametro.valor,
      descripcion:
        parametro.descripcion ?? "",
    });

    setErrors({});
    setShowForm(true);
  };


  const closeForm = () => {
    if (saving) return;
    setShowForm(false);
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
    });
    setErrors({});
  };

  const validate = () => {
    const nextErrors:
      Record<string, string> = {};
    const categoria =
      form.categoria.trim();
    const clave =
      form.clave.trim();
    const valor =
      form.valor.trim();
    const descripcion =
      form.descripcion?.trim() ?? "";

    if (!categoria) {
      nextErrors.categoria =
        "La categoría es obligatoria.";
    } else if (
      categoria.length > 80
    ) {
      nextErrors.categoria =
        "La categoría no puede superar los 80 caracteres.";
    }

    if (!clave) {
      nextErrors.clave =
        "La clave es obligatoria.";
    } else if (
      clave.length > 80
    ) {
      nextErrors.clave =
        "La clave no puede superar los 80 caracteres.";
    }

    if (!valor) {
      nextErrors.valor =
        "El valor es obligatorio.";
    } else if (
      valor.length > 500
    ) {
      nextErrors.valor =
        "El valor no puede superar los 500 caracteres.";
    }

    if (
      descripcion.length > 300
    ) {
      nextErrors.descripcion =
        "La descripción no puede superar los 300 caracteres.";
    }

    setErrors(nextErrors);
    return (
      Object.keys(nextErrors).length === 0
    );
  };

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    const body: ParametroRequest = {
      categoria:
        form.categoria.trim(),
      clave:
        form.clave.trim(),
      valor:
        form.valor.trim(),
      descripcion:
        form.descripcion?.trim() || undefined,
    };

    try {
      setSaving(true);
      if (editing) {
        await parametroService.update(
          editing.id,
          body
        );
        show(
          "Parámetro actualizado correctamente.",
          "success"
        );
      } else {
        await parametroService.create(
          body
        );
        show(
          "Parámetro creado correctamente.",
          "success"
        );
      }

      closeForm();
      await load();
    } catch (error) {
      show(
        errorMessage(error),
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (
    parametro: Parametro
  ) => {
    const confirmed =
      window.confirm(
        `¿Seguro que deseas desactivar el parámetro "${parametro.clave}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      await parametroService.deactivate(
        parametro.id
      );
      show(
        "Parámetro desactivado correctamente.",
        "success"
      );
      await load();
    } catch (error) {
      show(
        errorMessage(error),
        "error"
      );
    }
  };

  return (
    <>
      <PageHeader
        title="Parámetros"
        description="Administración de la configuración básica del sistema."
        actions={
          <button
            type="button"
            className="button"
            onClick={openCreate}
          >
            <Plus size={17} />
            Nuevo parámetro
          </button>
        }
      />
      {loading ? (
        <LoadingState />
      ) : rows.length ? (
        <div className="grid grid--3">
          {rows.map(
            (parametro) => (
              <article
                className="card"
                key={parametro.id}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "flex-start",
                    gap: 12,
                  }}
                >
                  <div>
                    <small className="muted">
                      {
                        parametro.categoria
                      }
                    </small>
                    <h2>
                      {
                        parametro.valor
                      }
                    </h2>
                    <strong>
                      {
                        parametro.clave
                      }
                    </strong>
                  </div>

                  <span
                    className={
                      parametro.activo
                        ? "status status--success"
                        : "status status--neutral"
                    }
                  >
                    {
                      parametro.activo
                        ? "Activo"
                        : "Inactivo"
                    }
                  </span>
                </div>

                {parametro.descripcion && (
                  <p className="muted">
                    {
                      parametro.descripcion
                    }
                  </p>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() =>
                      openEdit(parametro)
                    }
                  >
                    <Pencil size={16} />
                    Editar
                  </button>

                  {parametro.activo && (
                    <button
                      type="button"
                      className="button button--danger"
                      onClick={() =>
                        void handleDeactivate(
                          parametro
                        )
                      }
                    >
                      <Power size={16} />
                      Desactivar
                    </button>
                  )}
                </div>
              </article>
            )
          )}
        </div>
      ) : (
        <EmptyState
          title="No hay parámetros para mostrar"
        />
      )}
      {}
      {showForm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(0, 0, 0, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 1000,
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: 600,
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                marginBottom: 20,
              }}
            >
              <h2>

                {editing
                  ? "Editar parámetro"
                  : "Nuevo parámetro"}
              </h2>

              <button
                type="button"
                className="button button--secondary"
                onClick={closeForm}
                disabled={saving}
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="grid"
            >
              {/* CATEGORÍA */}
              <label>
                Categoría *
                <input
                  type="text"
                  value={
                    form.categoria
                  }
                  maxLength={80}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      categoria:
                        event.target.value,
                    })
                  }
                />
                {errors.categoria && (
                  <small
                    style={{
                      color: "red",
                    }}
                  >
                    {
                      errors.categoria
                    }
                  </small>
                )}
              </label>

              {/* CLAVE */}
              <label>
                Clave *
                <input
                  type="text"
                  value={
                    form.clave
                  }
                  maxLength={80}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      clave:
                        event.target.value,
                    })
                  }
                />
                {errors.clave && (
                  <small
                    style={{
                      color: "red",
                    }}
                  >
                    {
                      errors.clave
                    }
                  </small>
                )}
              </label>

              {/* VALOR */}
              <label>
                Valor *
                <textarea
                  value={
                    form.valor
                  }
                  maxLength={500}
                  rows={4}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      valor:
                        event.target.value,
                    })
                  }
                />
                {errors.valor && (
                  <small
                    style={{
                      color: "red",
                    }}
                  >
                    {
                      errors.valor
                    }
                  </small>
                )}
              </label>

              {/* DESCRIPCIÓN */}
              <label>
                Descripción
                <textarea
                  value={
                    form.descripcion ??
                    ""
                  }
                  maxLength={300}
                  rows={3}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      descripcion:
                        event.target.value,
                    })
                  }
                />
                {errors.descripcion && (
                  <small
                    style={{
                      color: "red",
                    }}
                  >
                    {
                      errors.descripcion
                    }
                  </small>
                )}
              </label>

              {/* BOTONES */}
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "flex-end",
                  gap: 12,
                  marginTop: 12,
                }}
              >
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="button"
                  disabled={saving}
                >
                  {saving
                    ? "Guardando..."
                    : editing
                      ? "Guardar cambios"
                      : "Crear parámetro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}