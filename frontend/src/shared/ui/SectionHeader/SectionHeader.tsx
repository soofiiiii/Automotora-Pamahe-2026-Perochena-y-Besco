/*
    Componente reutilizable para mostrar el encabezado de una sección.

    Se puede usar en distintas partes del home, por ejemplo:
    - sección de vehículos destacados,
    - sección de servicios,
    - sección de beneficios,
    - sección de contacto.

    Su objetivo es mantener una estructura visual uniforme:
    una etiqueta pequeña opcional, un título principal y una descripción opcional.

    Este componente no se comunica con la API.
    Solo recibe datos desde el componente padre mediante props.
*/

import "./SectionHeader.css";

/*
    Tipo de propiedades que puede recibir SectionHeader.

    eyebrow:
    Texto pequeño opcional que aparece arriba del título.
    Se usa como una etiqueta introductoria o categoría.

    title:
    Título principal de la sección.
    Es obligatorio porque el componente siempre necesita mostrar
    un encabezado principal.

    description:
    Texto descriptivo opcional.
    Sirve para explicar brevemente el contenido de la sección.
*/
type SectionHeaderProps = {
    eyebrow?: string;
    title: string;
    description?: string;
};

/*
    Componente SectionHeader.

    Recibe las props eyebrow, title y description mediante destructuring.

    Como eyebrow y description son opcionales, el componente verifica
    si existen antes de mostrarlas.
*/
export function SectionHeader({ eyebrow, title, description }: SectionHeaderProps) {
    return (
        /*
            Contenedor principal del encabezado de sección.

            La clase section-header se conecta con SectionHeader.css,
            donde se definen el ancho máximo, márgenes y estilos generales.
        */
        <div className="section-header">

            {/*
                Renderizado condicional de eyebrow.

                Si eyebrow tiene contenido, se muestra el <span>.
                Si no se recibe eyebrow, esta parte no se renderiza.

                Esto permite usar el componente con o sin etiqueta superior.
            */}
            {eyebrow && <span className="section-header__eyebrow">{eyebrow}</span>}

            {/*
                Título principal de la sección.

                Se usa h2 porque normalmente este componente se utilizará
                dentro de páginas que ya tienen un h1 principal.
            */}
            <h2>{title}</h2>

            {/*
                Renderizado condicional de description.

                Si description tiene contenido, se muestra el párrafo.
                Si no se recibe, no aparece ningún espacio innecesario.
            */}
            {description && <p>{description}</p>}
        </div>
    );
}