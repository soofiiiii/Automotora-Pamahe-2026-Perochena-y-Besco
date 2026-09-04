import { Link } from "react-router-dom";
import {
  APP_NAME,
  BUSINESS_ADDRESS,
  BUSINESS_LOCATION,
  DEFAULT_PHONE_DISPLAY,
  PRIVACY_CONTACT,
} from "../../../config/appConfig";

export default function PrivacyPage() {
  return (
    <div className="container legal-page">
      <span className="eyebrow">Privacidad y datos personales</span>
      <h1>Política de privacidad</h1>
      <p className="legal-page__lead">
        Esta política describe, en términos generales, cómo {APP_NAME} trata la información utilizada por el sitio público y el sistema interno.
      </p>

      <section className="legal-section">
        <h2>Responsable y alcance</h2>
        <p>
          Responsable: {APP_NAME}, {BUSINESS_ADDRESS || BUSINESS_LOCATION}. Para consultas relacionadas con datos personales podés utilizar {PRIVACY_CONTACT || `el teléfono ${DEFAULT_PHONE_DISPLAY} hasta que la empresa configure un canal específico de privacidad`}.
        </p>
      </section>

      <section className="legal-section">
        <h2>Datos y finalidades</h2>
        <p>
          El sistema puede tratar datos de clientes, vendedores y personal necesarios para gestionar vehículos, compras, ventas, taller, facturación operativa, seguridad, auditoría y atención de consultas. Se aplica el criterio de minimización: no deberían solicitarse datos que no sean necesarios para la operación correspondiente.
        </p>
      </section>

      <section className="legal-section">
        <h2>Chat y servicios externos</h2>
        <p>
          No ingreses cédulas, contraseñas, datos bancarios ni información sensible en el asistente público. Los enlaces de WhatsApp y llamadas abren servicios externos, sujetos además a las condiciones y políticas de sus respectivos proveedores.
        </p>
      </section>

      <section className="legal-section">
        <h2>Seguridad y conservación</h2>
        <p>
          La aplicación implementa controles de acceso por rol, sesión con expiración, validación de entradas y separación entre información pública e interna. La conservación definitiva, respaldo, auditoría y eliminación de datos dependen también de la configuración y políticas del backend y de la infraestructura de la empresa.
        </p>
      </section>

      <section className="legal-section">
        <h2>Derechos de las personas</h2>
        <p>
          Las personas titulares pueden solicitar el acceso, rectificación, actualización, inclusión o supresión de sus datos cuando corresponda conforme a la normativa uruguaya aplicable. La empresa debe verificar la identidad de quien realiza la solicitud antes de entregar o modificar información personal.
        </p>
      </section>

      <Link className="button button--secondary" to="/">Volver al inicio</Link>
    </div>
  );
}
