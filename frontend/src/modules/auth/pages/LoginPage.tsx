/*
    Página temporal de login o acceso interno.

    Esta vista funciona como base inicial para la futura autenticación
    de usuarios internos del sistema.

    En esta primera versión:
    - no hay formulario real,
    - no se validan usuarios,
    - no se envían datos a la API,
    - no se manejan tokens ni sesiones.

    Más adelante, esta pantalla podrá incluir:
    - campos de usuario o correo,
    - campo de contraseña,
    - validaciones,
    - envío de credenciales al backend,
    - manejo de sesión,
    - redirección al dashboard interno.
*/

import { Link } from "react-router-dom";

/*
    Logo reutilizable de Automotora Pamahe.

    Se muestra en la tarjeta para reforzar la identidad visual
    del sistema antes del acceso interno.
*/
import { AppLogo } from "../../../shared/components/AppLogo/AppLogo";

/*
    Botón reutilizable del sistema.

    En esta pantalla se usa para volver al inicio.
*/
import { AppButton } from "../../../shared/ui/AppButton/AppButton";

/*
    Componente LoginPage.

    Representa la futura pantalla de acceso para usuarios internos:
    dueño, administrador, vendedor y encargado de taller.
*/
export function LoginPage() {
    return (
        /*
            main representa el contenido principal de la pantalla.

            placeholder-page es una clase global que centra el contenido
            y le da una estructura temporal a páginas que todavía
            no tienen su diseño definitivo.
        */
        <main className="placeholder-page">

            {/*
                Tarjeta temporal de contenido.

                placeholder-card viene de los estilos globales.
                Sirve para mostrar una pantalla simple, centrada y prolija
                mientras se desarrolla la funcionalidad final.
            */}
            <section className="placeholder-card">

                {/*
                    Logo de la aplicación.

                    Se muestra en versión completa porque esta vista
                    representa un punto importante de entrada al sistema.
                */}
                <AppLogo />

                {/*
                    Título principal de la vista.

                    Se usa h1 porque esta pantalla tiene su propio
                    encabezado principal.
                */}
                <h1>Acceso interno</h1>

                {/*
                    Descripción temporal de la funcionalidad futura.

                    Explica que esta página será reemplazada luego
                    por el formulario real de autenticación.
                */}
                <p>
                    Esta vista será reemplazada por el formulario de autenticación para usuarios
                    internos: dueño, administrador, vendedor y encargado de taller.
                </p>

                {/*
                    Botón para volver al inicio.

                    Como AppButton recibe la prop "to", internamente
                    se comporta como un enlace de navegación interna.
                */}
                <AppButton to="/" variant="secondary">
                    Volver al inicio
                </AppButton>

                {/*
                    Enlace alternativo hacia el catálogo público.

                    Se usa Link de react-router-dom para navegar sin recargar
                    toda la aplicación.

                    La clase home-hero__catalog-link parece venir del CSS del Home.
                    Funciona, pero más adelante convendría mover este estilo
                    a una clase más general, por ejemplo:
                    placeholder-card__link o auth-card__link.

                    Así se evita que una pantalla de login dependa de una clase
                    pensada originalmente para el Hero del Home.
                */}
                <p className="home-hero__catalog-link">
                    <Link to="/catalogo">Ir al catálogo público</Link>
                </p>
            </section>
        </main>
    );
}