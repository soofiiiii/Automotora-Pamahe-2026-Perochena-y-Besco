/*
    Componente reutilizable para mostrar el estado de un vehículo.

    Este componente recibe un estado y lo muestra como una etiqueta visual.

    Por ejemplo:
    - Disponible
    - En taller
    - Reservado

    No se comunica directamente con la API.
    En una versión futura, el estado podría venir desde la base de datos
    a través del backend, pero este componente solo se encarga de mostrarlo.
*/

import "./StatusBadge.css";

/*
    Tipo de propiedades que recibe StatusBadge.

    status solo puede tener uno de estos tres valores:
    - "Disponible"
    - "En taller"
    - "Reservado"

    Esto es importante porque TypeScript evita que se use un estado incorrecto.

    Por ejemplo, esto daría error:
    <StatusBadge status="Vendido" />

    A menos que "Vendido" sea agregado también al tipo.
*/
type StatusBadgeProps = {
    status: "Disponible" | "En taller" | "Reservado";
};

/*
    Mapa que relaciona cada estado visible con una clase CSS.

    La clave representa el texto del estado.
    El valor representa el modificador CSS que se usará para aplicar estilos.

    Por ejemplo:
    "Disponible" se transforma en "available"

    Luego se usará para construir esta clase:
    status-badge--available
*/
const statusClassMap: Record<StatusBadgeProps["status"], string> = {
    Disponible: "available",
    "En taller": "workshop",
    Reservado: "reserved",
};

/*
    Componente StatusBadge.

    Recibe la prop status y devuelve un <span> con clases dinámicas.

    Se usa <span> porque es un elemento pequeño de texto,
    no una sección completa ni un botón.
*/
export function StatusBadge({ status }: StatusBadgeProps) {
    return (
        /*
            Se construye el className de forma dinámica.

            Siempre se aplica la clase base:
            status-badge

            Y además se agrega una clase modificadora según el estado:
            status-badge--available
            status-badge--workshop
            status-badge--reserved

            Esa clase modificadora permite cambiar el color del badge
            dependiendo del estado recibido.
        */
        <span className={`status-badge status-badge--${statusClassMap[status]}`}>
            {status}
        </span>
    );
}