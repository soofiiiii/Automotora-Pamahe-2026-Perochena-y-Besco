import { Link } from "react-router-dom";
import { APP_NAME, BUSINESS_LOCATION } from "../../../config/appConfig";

export default function LegalNoticePage() {
  return (
    <div className="container legal-page">
      <span className="eyebrow">Información al consumidor</span>
      <h1>Información sobre el catálogo</h1>
      <p className="legal-page__lead">
        El catálogo digital de {APP_NAME} presenta vehículos usados ofrecidos por la automotora en {BUSINESS_LOCATION}.
      </p>

      <section className="legal-section">
        <h2>Condición de los vehículos</h2>
        <p>
          Las unidades publicadas se identifican como vehículos usados. La ficha busca mostrar de forma clara los datos disponibles de cada unidad, su precio publicado cuando exista, kilometraje informado, fotografías y vías de contacto.
        </p>
      </section>

      <section className="legal-section">
        <h2>Precio y disponibilidad</h2>
        <p>
          La disponibilidad puede cambiar por reserva, venta o retiro de publicación. Cuando una ficha indique “Consultar precio”, no se muestra una oferta económica cerrada. Antes de concretar una operación, la automotora debe confirmar precio final, condiciones, documentación, forma de pago y cualquier garantía que corresponda.
        </p>
      </section>

      <section className="legal-section">
        <h2>Información y publicidad</h2>
        <p>
          La información publicada debe mantenerse actualizada, clara y veraz. Si se detecta una diferencia entre la ficha digital y la situación real del vehículo, debe corregirse la publicación y aclararse la información antes de formalizar la operación.
        </p>
      </section>

      <div className="notice">
        Esta sección no reemplaza la documentación contractual, comprobantes, garantía cuando corresponda ni las obligaciones legales de información previas a la venta.
      </div>
      <Link className="button button--secondary" to="/catalogo">Ver catálogo</Link>
    </div>
  );
}
