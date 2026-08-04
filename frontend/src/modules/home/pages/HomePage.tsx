/*
    Página principal del frontend de Automotora Pamahe.

    Este componente representa el Home del sistema.

    Su función principal es organizar visualmente las secciones iniciales:
    - presentación del sistema,
    - resumen operativo,
    - módulos principales,
    - flujo del vehículo,
    - vista previa del catálogo,
    - llamada final a la acción.

    Esta página no guarda datos.
    No modifica información.
    No se comunica directamente con la API.

    En esta primera base, los datos se importan desde homeData.ts,
    donde están definidos de forma estática para poder construir
    la interfaz antes de conectar el backend.
*/

/*
    Botón reutilizable del sistema.

    Se usa para navegar hacia rutas internas como:
    - /catalogo
    - /login

    AppButton internamente puede comportarse como Link
    cuando recibe la propiedad "to".
*/
import { AppButton } from "../../../shared/ui/AppButton/AppButton";

/*
    Encabezado reutilizable para secciones.

    Permite mostrar una etiqueta superior, un título y una descripción
    manteniendo el mismo estilo visual en todo el Home.
*/
import { SectionHeader } from "../../../shared/ui/SectionHeader/SectionHeader";

/*
    Tarjeta que representa un módulo funcional del sistema.

    Por ejemplo:
    - Vehículos
    - Clientes
    - Taller
    - Compras
    - Ventas
    - Reportes
*/
import { ModuleCard } from "../components/ModuleCard";

/*
    Componente que muestra un paso del proceso operativo.

    Se usa para explicar el ciclo principal del vehículo dentro
    de la automotora.
*/
import { ProcessStep } from "../components/ProcessStep";

/*
    Tarjeta de resumen operativo.

    Se usa para mostrar indicadores iniciales como stock,
    unidades en taller, ventas del mes o rentabilidad estimada.
*/
import { SummaryCard } from "../components/SummaryCard";

/*
    Tarjeta de vista previa de vehículo.

    Se usa para mostrar vehículos de ejemplo dentro del Home,
    simulando una futura sección de catálogo.
*/
import { VehiclePreviewCard } from "../components/VehiclePreviewCard";

/*
    Datos estáticos utilizados por el Home.

    Estos arreglos funcionan como datos de prueba mientras todavía
    no existe conexión real con la API.

    Más adelante, estos datos podrían reemplazarse por llamadas al backend.
*/
import {
  moduleItems,
  processSteps,
  summaryItems,
  vehiclePreviews,
} from "../data/homeData";

/*
    Estilos específicos de la página Home.

    Este archivo define la apariencia de las secciones:
    hero, grids, tarjetas, bloques suaves, CTA final, etc.
*/
import "./HomePage.css";

/*
    Componente principal de la página Home.

    Se exporta para poder usarlo dentro del sistema de rutas,
    normalmente desde AppRouter.
*/
export function HomePage() {
  return (
    /*
        main representa el contenido principal de la página.

        Se usa una sola vez por pantalla para indicar cuál es
        el contenido central del documento.

        La clase home-page permite aplicar estilos generales
        propios de esta página.
    */
    <main className="home-page">

      {/*
          Sección principal o Hero.

          Es la primera parte visible del Home.
          Presenta el sistema, resume su propósito y ofrece
          accesos rápidos al catálogo público y al ingreso interno.
      */}
      <section className="home-hero">

        {/*
            page-container centra el contenido y limita el ancho máximo.

            home-hero__grid organiza la sección en dos columnas:
            - contenido textual principal,
            - panel de resumen operativo.
        */}
        <div className="page-container home-hero__grid">

          {/*
              Contenido principal del Hero.

              Incluye una etiqueta, un título fuerte, una descripción
              y botones de acción.
          */}
          <div className="home-hero__content">

            {/*
                Etiqueta pequeña superior.

                Sirve para identificar rápidamente el tipo de sistema
                que se está presentando.
            */}
            <span className="home-hero__eyebrow">Sistema Integral Pamahe</span>

            {/*
                Título principal de la página.

                Se usa h1 porque es el encabezado más importante del Home.
                Cada página debería tener un h1 principal.
            */}
            <h1>Gestión centralizada para vehículos, taller, ventas y catálogo.</h1>

            {/*
                Descripción general del sistema.

                Explica qué módulos o áreas se busca cubrir desde esta base visual.
            */}
            <p>
              Una base visual para comenzar el desarrollo del sistema de Automotora Pamahe:
              inventario, clientes, refacciones, compras, ventas, reportes y publicación
              comercial desde una misma plataforma.
            </p>

            {/*
                Contenedor de acciones principales.

                Agrupa los botones más importantes del Hero.
            */}
            <div className="home-hero__actions">

              {/*
                  Botón que navega hacia el catálogo público.

                  Usa la variante primary por defecto.
              */}
              <AppButton to="/catalogo">Ver catálogo público</AppButton>

              {/*
                  Botón que navega hacia el login.

                  Usa la variante secundaria para diferenciarlo visualmente
                  del botón principal.
              */}
              <AppButton to="/login" variant="secondary">
                Ingresar al sistema
              </AppButton>
            </div>
          </div>

          {/*
              Panel lateral del Hero.

              Se usa aside porque muestra información complementaria
              al contenido principal.

              aria-label ayuda a que tecnologías de asistencia entiendan
              qué representa este bloque.
          */}
          <aside className="home-hero__panel" aria-label="Resumen operativo">

            {/*
                Encabezado del panel lateral.
            */}
            <div className="home-hero__panel-header">
              <span>Panel inicial</span>
              <strong>Vista gerencial</strong>
            </div>

            {/*
                Lista de datos resumidos del panel.

                Estos elementos son informativos y sirven para mostrar
                qué tipo de control tendrá el sistema.
            */}
            <div className="home-hero__panel-list">
              <div>
                <span>Estado principal</span>
                <strong>Stock actualizado</strong>
              </div>

              <div>
                <span>Control de taller</span>
                <strong>Costos asociados</strong>
              </div>

              <div>
                <span>Canal público</span>
                <strong>Catálogo disponible</strong>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/*
          Sección de indicadores.

          Muestra tarjetas de resumen con datos demostrativos.
      */}
      <section className="home-section">
        <div className="page-container">

          {/*
              Encabezado reutilizable de la sección.
          */}
          <SectionHeader
            eyebrow="Indicadores"
            title="Resumen operativo inicial"
            description="Estos datos son demostrativos y sirven para construir la interfaz antes de conectarla con la API."
          />

          {/*
              Grilla de tarjetas de resumen.

              summaryItems viene desde homeData.ts.
              map recorre el arreglo y crea una SummaryCard por cada item.
          */}
          <div className="summary-grid">
            {summaryItems.map((item) => (
              /*
                  key ayuda a React a identificar cada elemento de la lista.

                  En este caso se usa item.title porque cada tarjeta tiene
                  un título distinto.
              */
              <SummaryCard key={item.title} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/*
          Sección de módulos.

          home-section--soft aplica una variante visual más suave,
          normalmente con otro fondo o separación.
      */}
      <section className="home-section home-section--soft">
        <div className="page-container">
          <SectionHeader
            eyebrow="Módulos"
            title="Base de navegación para las próximas vistas"
            description="Cada tarjeta representa una sección funcional que luego podrá conectarse con sus ABM, listados, formularios y servicios."
          />

          {/*
              Grilla de módulos del sistema.

              moduleItems contiene los módulos definidos en homeData.ts.
              Cada ModuleCard recibe un módulo y muestra su título,
              descripción y botón de navegación.
          */}
          <div className="module-grid">
            {moduleItems.map((item) => (
              <ModuleCard key={item.title} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/*
          Sección del flujo principal del vehículo.

          Explica el proceso general desde que el vehículo ingresa
          hasta que se vende.
      */}
      <section className="home-section">
        <div className="page-container home-process">
          <SectionHeader
            eyebrow="Flujo principal"
            title="Ciclo operativo del vehículo"
            description="El vehículo funciona como eje del sistema: ingresa por compra, puede pasar por taller, queda disponible y finalmente se vende."
          />

          {/*
              Grilla de pasos del proceso.

              processSteps viene desde homeData.ts.
              Cada elemento se muestra mediante ProcessStep.
          */}
          <div className="process-grid">
            {processSteps.map((item) => (
              <ProcessStep key={item.number} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/*
          Sección de vista previa de catálogo.

          Muestra algunos vehículos de ejemplo para representar cómo
          podría verse el catálogo público.
      */}
      <section className="home-section home-section--soft">
        <div className="page-container">
          <SectionHeader
            eyebrow="Catálogo"
            title="Vista previa de vehículos"
            description="Muestra de cómo se podrán visualizar unidades comerciales sin exponer información interna del negocio."
          />

          {/*
              Grilla de vehículos.

              vehiclePreviews contiene vehículos de prueba.
              Cada VehiclePreviewCard muestra una tarjeta con estado,
              marca, modelo, año, kilometraje y precio.
          */}
          <div className="vehicle-grid">
            {vehiclePreviews.map((vehicle) => (
              <VehiclePreviewCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>

          {/*
              Pie de sección.

              Contiene un botón para navegar al catálogo completo.
          */}
          <div className="home-section__footer">
            <AppButton to="/catalogo" variant="secondary">
              Ir al catálogo
            </AppButton>
          </div>
        </div>
      </section>

      {/*
          Sección final de llamada a la acción.

          Resume el próximo paso del desarrollo:
          conectar esta base visual con autenticación, rutas protegidas
          y módulos internos.
      */}
      <section className="home-cta">

        {/*
            Contenedor interno del CTA.

            Combina texto informativo y un botón de ingreso.
        */}
        <div className="page-container home-cta__content">
          <div>
            <span>Próximo paso</span>

            <h2>Conectar esta base visual con autenticación y módulos internos.</h2>

            <p>
              Desde este Home se puede avanzar ordenadamente hacia login, rutas protegidas,
              dashboard interno, ABM de vehículos y catálogo público.
            </p>
          </div>

          {/*
              Botón final para iniciar el ingreso al sistema.
          */}
          <AppButton to="/login">Comenzar ingreso</AppButton>
        </div>
      </section>
    </main>
  );
}