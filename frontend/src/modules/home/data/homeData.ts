/*
    Archivo de datos estáticos para el home.

    Este archivo contiene información de prueba que permite construir
    la primera versión visual del frontend sin conectarse todavía a la API.

    No contiene lógica de guardado.
    No modifica datos.
    No se comunica con el backend.

    Su objetivo es alimentar los componentes del home con datos simulados,
    manteniendo una estructura parecida a la que luego podría venir
    desde la base de datos mediante la API.
*/

/*
    Se importan tipos desde home.types.

    Se usa "import type" porque estos elementos solo existen para TypeScript.
    Sirven para validar la forma de los datos durante el desarrollo,
    pero no se convierten en código JavaScript al ejecutar la aplicación.

    Esto ayuda a que cada arreglo tenga una estructura clara y controlada.
*/
import type {
    ModuleItem, 
    ProcessStepItem,
    SummaryItem,
    VehiclePreview,
} from "../types/home.types";

/*
    Datos resumidos que se muestran en tarjetas informativas del home.

    Cada objeto representa una tarjeta de resumen.

    SummaryItem exige que cada elemento tenga:
    - title: título de la tarjeta.
    - value: valor destacado.
    - detail: aclaración o descripción breve.

    En esta primera etapa son datos fijos de ejemplo.
    Más adelante podrían venir desde reportes del backend.
*/
export const summaryItems: SummaryItem[] = [
    {
        title: "Vehículos en stock",
        value: "18",
        detail: "Disponibles, reservados y en preparación",
    },
    {
        title: "Unidades en taller",
        value: "5",
        detail: "Con trabajos pendientes o en curso",
    },
    {
        title: "Ventas del mes",
        value: "7",
        detail: "Operaciones cerradas en el período",
    },
    {
        title: "Rentabilidad estimada",
        value: "USD 14.800",
        detail: "Margen acumulado de operaciones cerradas",
    },
];

/*
    Datos de los módulos principales del sistema.

    Cada objeto representa una tarjeta o acceso del home hacia una sección
    funcional del sistema.

    ModuleItem exige que cada módulo tenga:
    - title: nombre del módulo.
    - description: explicación breve del módulo.
    - path: ruta interna a la que se navegará.
    - actionLabel: texto del botón o acción.

    La propiedad path se comunica directamente con las rutas definidas
    en AppRouter. Por ejemplo, "/vehiculos" debería existir como ruta
    para que la navegación funcione correctamente.
*/
export const moduleItems: ModuleItem[] = [
    {
        title: "Vehículos e inventario",
        description: "Registro, estados, historial y control del stock interno.",
        path: "/vehiculos",
        actionLabel: "Preparar módulo",
    },
    {
        title: "Clientes",
        description: "Gestión de compradores, vendedores e historial comercial.",
        path: "/clientes",
        actionLabel: "Preparar módulo",
    },
    {
        title: "Taller y refacciones",
        description: "Carga de trabajos, costos, mano de obra y seguimiento operativo.",
        path: "/taller",
        actionLabel: "Preparar módulo",
    },
    {
        title: "Compras",
        description: "Ingreso de vehículos, costo inicial y documentación interna.",
        path: "/compras",
        actionLabel: "Preparar módulo",
    },
    {
        title: "Ventas",
        description: "Cierre comercial, cliente comprador y comprobante interno.",
        path: "/ventas",
        actionLabel: "Preparar módulo",
    },
    {
        title: "Reportes",
        description: "Indicadores de stock, costos, ventas y rentabilidad.",
        path: "/reportes",
        actionLabel: "Preparar módulo",
    },
];

/*
    Vista previa de vehículos para mostrar en el home.

    Cada objeto representa un vehículo resumido, no necesariamente
    una ficha completa.

    VehiclePreview exige datos como:
    - id
    - brand
    - model
    - year
    - price
    - mileage
    - status
    - description

    Estos datos pueden ser usados por componentes como VehicleCard.

    En una versión futura, esta información podría venir desde un endpoint
    del backend, por ejemplo:

    GET /api/vehiculos/destacados
    GET /api/vehiculos/disponibles
*/
export const vehiclePreviews: VehiclePreview[] = [
    {
        /*
            Identificador único del vehículo.
            En el futuro podría coincidir con el id de la base de datos.
        */
        id: 1,

        /*
            Marca del vehículo.
        */
        brand: "Toyota",

        /*
            Modelo del vehículo.
        */
        model: "Corolla XEI",

        /*
            Año del vehículo.
        */
        year: 2018,

        /*
            Precio numérico del vehículo.

            Se guarda como number para poder formatearlo luego,
            por ejemplo usando formatCurrency(price).
        */
        price: 18500,

        /*
            Kilometraje del vehículo.
        */
        mileage: 92000,

        /*
            Estado actual del vehículo.

            Este valor debe coincidir con el tipo VehicleStatus:
            "Disponible", "En taller" o "Reservado".

            También puede ser usado por StatusBadge para mostrar
            una etiqueta visual con color.
        */
        status: "Disponible",

        /*
            Descripción breve para mostrar en la tarjeta del vehículo.
        */
        description: "Sedán automático, preparado para publicación comercial.",
    },
    {
        id: 2,
        brand: "Volkswagen",
        model: "Saveiro",
        year: 2020,
        price: 16900,
        mileage: 74000,
        status: "Reservado",
        description: "Unidad utilitaria con consulta comercial en proceso.",
    },
    {
        id: 3,
        brand: "Chevrolet",
        model: "Onix LT",
        year: 2019,
        price: 14200,
        mileage: 88000,
        status: "En taller",
        description: "Vehículo en reacondicionamiento previo a publicación.",
    },
];

/*
    Pasos del proceso operativo de la automotora.

    Este arreglo permite mostrar en el home una explicación simple
    del flujo principal del negocio:

    1. Compra o ingreso del vehículo.
    2. Taller y refacciones.
    3. Disponibilidad para la venta.
    4. Venta y cierre comercial.

    ProcessStepItem exige:
    - number: número visual del paso.
    - title: título del paso.
    - description: explicación breve.
*/
export const processSteps: ProcessStepItem[] = [
    {
        number: "01",
        title: "Ingreso y compra",
        description: "Se registra el vehículo, el cliente vendedor y el costo inicial.",
    },
    {
        number: "02",
        title: "Taller y refacciones",
        description: "Se documentan trabajos, repuestos, mano de obra y responsables.",
    },
    {
        number: "03",
        title: "Disponibilidad comercial",
        description: "El vehículo queda listo para venta y puede publicarse en catálogo.",
    },
    {
        number: "04",
        title: "Venta y cierre",
        description: "Se registra la operación final y se calcula la rentabilidad.",
    },
];