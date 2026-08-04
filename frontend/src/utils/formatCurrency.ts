/*
    Función utilitaria para formatear valores numéricos como moneda.

    En este caso, recibe un número y lo devuelve como texto
    con formato de moneda en dólares.

    Por ejemplo:
    18500

    se puede mostrar como:
    US$ 18.500

    Esta función no renderiza componentes.
    Tampoco se comunica con la API.

    Su objetivo es centralizar el formato de precios para no repetir
    la misma lógica en varias partes del frontend.
*/
export function formatCurrency(value: number): string {

    /*
        Intl.NumberFormat es una herramienta nativa de JavaScript
        para formatear números según un idioma o región.

        "es-UY" indica que se usará el formato correspondiente
        al español de Uruguay.

        Esto afecta, por ejemplo:
        - separadores de miles,
        - símbolo de moneda,
        - orden del símbolo,
        - formato general del número.
    */
    return new Intl.NumberFormat("es-UY", {

        /*
            style: "currency" indica que el número debe mostrarse
            como una moneda y no como un número común.
        */
        style: "currency",

        /*
            currency: "USD" indica que la moneda será dólar estadounidense.

            Esto tiene sentido para una automotora, porque los vehículos
            suelen manejarse comercialmente en dólares.
        */
        currency: "USD",

        /*
            maximumFractionDigits: 0 indica que no se mostrarán decimales.

            Por ejemplo, en vez de mostrar:
            US$ 18.500,00

            mostrará:
            US$ 18.500

            Esto es más limpio para precios de vehículos.
        */
        maximumFractionDigits: 0,

    }).format(value);
}