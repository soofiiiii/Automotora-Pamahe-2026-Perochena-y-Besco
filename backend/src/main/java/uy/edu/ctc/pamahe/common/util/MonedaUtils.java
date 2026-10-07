package uy.edu.ctc.pamahe.common.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

import uy.edu.ctc.pamahe.common.exception.BusinessException;

/** Centraliza la conversión monetaria utilizada por precios comerciales de vehículos. */
public final class MonedaUtils {

    public static final String CATEGORIA_MONEDA = "MONEDA";
    public static final String CLAVE_USD_UYU = "USD_UYU";
    public static final BigDecimal COTIZACION_USD_UYU_PREDETERMINADA = new BigDecimal("41.00");

    private MonedaUtils() {
    }

    public static BigDecimal parsearCotizacionUsdUyu(String valor) {
        if (valor == null || valor.isBlank()) {
            throw new BusinessException("La cotización USD/UYU no puede estar vacía.");
        }

        try {
            BigDecimal cotizacion = new BigDecimal(valor.trim());
            if (cotizacion.compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessException("La cotización USD/UYU debe ser mayor que cero.");
            }
            return cotizacion;
        } catch (NumberFormatException ex) {
            throw new BusinessException("La cotización USD/UYU debe ser un número válido.");
        }
    }

    public static BigDecimal convertirUsdAUyu(BigDecimal usd, BigDecimal cotizacion) {
        if (usd == null) {
            return null;
        }
        return usd.multiply(cotizacion).setScale(2, RoundingMode.HALF_UP);
    }

    public static BigDecimal convertirUyuAUsd(BigDecimal uyu, BigDecimal cotizacion) {
        if (uyu == null) {
            return null;
        }
        return uyu.divide(cotizacion, 6, RoundingMode.HALF_UP);
    }
}
