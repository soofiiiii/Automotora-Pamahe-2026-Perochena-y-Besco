package uy.edu.ctc.pamahe.modules.ventas.model;

public enum MedioPagoVenta {
    TRANSFERENCIA,
    EFECTIVO,
    FINANCIACION_BANCARIA,
    FINANCIACION_PROPIA,
    VEHICULO_PARTE_PAGO;

    public boolean esFinanciacion() {
        return this == FINANCIACION_BANCARIA || this == FINANCIACION_PROPIA;
    }
}
