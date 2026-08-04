/*
    Archivo de tipos reutilizables para el frontend.

    En TypeScript, un type permite definir la forma que debe tener un dato.
    Esto ayuda a que el editor detecte errores antes de ejecutar la aplicación.

    Este archivo no genera elementos visuales.
    Tampoco se comunica directamente con la API.

    Su función es servir como contrato interno entre los componentes.
    Es decir, define qué datos espera recibir cada parte del home.
*/

/*
    Tipo que representa los estados posibles de un vehículo.

    Al definirlo así, se evita usar cualquier texto libre.
    El estado de un vehículo solo puede ser uno de estos valores:

    - "Disponible"
    - "En taller"
    - "Reservado"

    Esto ayuda a mantener coherencia entre componentes.
    Por ejemplo, este mismo tipo puede usarse en:
    - tarjetas de vehículos,
    - badges de estado,
    - listados,
    - filtros futuros.
*/
export type VehicleStatus = "Disponible" | "En taller" | "Reservado";

/*
    Tipo para representar un dato resumido del sistema.

    Puede usarse en tarjetas de resumen del home, por ejemplo:
    - Vehículos disponibles
    - Ventas registradas
    - Refacciones activas
    - Clientes cargados

    title:
    Texto principal de la tarjeta.

    value:
    Valor destacado que se quiere mostrar.

    detail:
    Texto complementario o aclaración breve.
*/
export type SummaryItem = {
    title: string;
    value: string;
    detail: string;
};

/*
    Tipo para representar un módulo o acceso del sistema.

    Puede usarse en tarjetas que llevan a distintas secciones,
    como vehículos, clientes, ventas, compras o taller.

    title:
    Nombre del módulo.

    description:
    Explicación breve de qué permite hacer ese módulo.

    path:
    Ruta interna a la que debe navegar el usuario.

    actionLabel:
    Texto que se mostrará en el botón o enlace de acción.
*/
export type ModuleItem = { 
    title: string;
    description: string;
    path: string;
    actionLabel: string;
};

/*
    Tipo para representar una vista previa de un vehículo.

    Este tipo se puede usar en el home para mostrar algunos vehículos
    destacados o disponibles, sin necesidad de cargar todos los datos
    completos de una ficha técnica.

    En una versión futura, estos datos podrían venir desde la API.
*/
export type VehiclePreview = {
    /*
        Identificador único del vehículo.

        Sirve para diferenciar un vehículo de otro.
        En el futuro podría coincidir con el id generado en la base de datos.
    */
    id: number;

    /*
        Marca del vehículo.
        Ejemplo: Toyota, Chevrolet, Volkswagen.
    */
    brand: string;

    /*
        Modelo del vehículo.
        Ejemplo: Corolla, Onix, Gol.
    */
    model: string;

    /*
        Año del vehículo.
        Se define como number porque representa un valor numérico.
    */
    year: number;

    /*
        Precio del vehículo.

        Se guarda como number para poder realizar cálculos,
        ordenar por precio o aplicar filtros.
    */
    price: number;

    /*
        Kilometraje del vehículo.

        También se guarda como number porque puede usarse para filtros,
        comparaciones u ordenamientos.
    */
    mileage: number;

    /*
        Estado actual del vehículo.

        Usa el tipo VehicleStatus definido arriba, por lo que solo acepta:
        "Disponible", "En taller" o "Reservado".
    */
    status: VehicleStatus;

    /*
        Descripción breve del vehículo.

        Puede mostrar información comercial o técnica resumida.
    */
    description: string; 
};

/*
    Tipo para representar un paso de proceso.

    Puede usarse en una sección del home que explique cómo trabaja
    la automotora o cómo se organiza el sistema.

    Por ejemplo:
    1. Registro del vehículo
    2. Refacción o revisión
    3. Publicación para la venta
    4. Venta y comprobante
*/
export type ProcessStepItem = {
    /*
        Número o identificador visual del paso.

        Se define como string y no como number porque puede mostrarse
        con formatos como "01", "02", "03".
    */
    number: string;

    /*
        Título del paso.
    */
    title: string;

    /*
        Explicación breve de lo que ocurre en ese paso.
    */
    description: string;
};