package uy.edu.ctc.pamahe.modules.vehiculos.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import uy.edu.ctc.pamahe.common.model.BaseEntity;

import java.math.BigDecimal;

/** Entidad central que vincula el ciclo operativo, comercial y económico de cada unidad. */
@Entity
@Table(name = "vehiculos")
public class Vehiculo extends BaseEntity {

    @Column(nullable = false, length = 80)
    private String marca;

    @Column(nullable = false, length = 80)
    private String modelo;

    @Column(name = "tipo_vehiculo", length = 50)
    private String tipoVehiculo;

    @Column(nullable = false)
    private Integer anio;

    @Column(unique = true, length = 30)
    private String matricula;

    @Column(name = "numero_chasis", unique = true, length = 80)
    private String numeroChasis;

    @Column(length = 60)
    private String color;

    private Integer kilometraje;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EstadoVehiculo estado = EstadoVehiculo.COMPRADO;

    @Enumerated(EnumType.STRING)
    @Column(name = "ubicacion_actual", nullable = false, length = 30)
    private UbicacionVehiculo ubicacionActual = UbicacionVehiculo.LOCAL;

    @Column(name = "costo_inicial", precision = 14, scale = 2)
    private BigDecimal costoInicial = BigDecimal.ZERO;

    @Column(name = "precio_venta_estimado", precision = 14, scale = 2)
    private BigDecimal precioVentaEstimado = BigDecimal.ZERO;

    // USD es la moneda principal del precio comercial; UYU se conserva por compatibilidad histórica.
    @Column(name = "precio_venta_usd", precision = 16, scale = 6)
    private BigDecimal precioVentaUsd = BigDecimal.ZERO;

    @Column(nullable = false)
    private Boolean publicado = false;

    // La descripción comercial se separa de las observaciones internas para controlar la exposición pública.
    @Column(name = "descripcion_publica", length = 1000)
    private String descripcionPublica;

    @Column(name = "observaciones_internas", length = 1000)
    private String observacionesInternas;

    public String getMarca() {
        return this.marca;
    }

    public void setMarca(String marca) {
        this.marca = marca;
    }

    public String getModelo() {
        return this.modelo;
    }

    public void setModelo(String modelo) {
        this.modelo = modelo;
    }

    public String getTipoVehiculo() {
        return this.tipoVehiculo;
    }

    public void setTipoVehiculo(String tipoVehiculo) {
        this.tipoVehiculo = tipoVehiculo;
    }

    public Integer getAnio() {
        return this.anio;
    }

    public void setAnio(Integer anio) {
        this.anio = anio;
    }

    public String getMatricula() {
        return this.matricula;
    }

    public void setMatricula(String matricula) {
        this.matricula = matricula;
    }

    public String getNumeroChasis() {
        return this.numeroChasis;
    }

    public void setNumeroChasis(String numeroChasis) {
        this.numeroChasis = numeroChasis;
    }

    public String getColor() {
        return this.color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public Integer getKilometraje() {
        return this.kilometraje;
    }

    public void setKilometraje(Integer kilometraje) {
        this.kilometraje = kilometraje;
    }

    public EstadoVehiculo getEstado() {
        return this.estado;
    }

    public void setEstado(EstadoVehiculo estado) {
        this.estado = estado;
    }

    public UbicacionVehiculo getUbicacionActual() {
        return this.ubicacionActual;
    }

    public void setUbicacionActual(UbicacionVehiculo ubicacionActual) {
        this.ubicacionActual = ubicacionActual;
    }

    public BigDecimal getCostoInicial() {
        return this.costoInicial;
    }

    public void setCostoInicial(BigDecimal costoInicial) {
        this.costoInicial = costoInicial;
    }

    public BigDecimal getPrecioVentaEstimado() {
        return this.precioVentaEstimado;
    }

    public void setPrecioVentaEstimado(BigDecimal precioVentaEstimado) {
        this.precioVentaEstimado = precioVentaEstimado;
    }

    public BigDecimal getPrecioVentaUsd() {
        return this.precioVentaUsd;
    }

    public void setPrecioVentaUsd(BigDecimal precioVentaUsd) {
        this.precioVentaUsd = precioVentaUsd;
    }

    public Boolean getPublicado() {
        return this.publicado;
    }

    public void setPublicado(Boolean publicado) {
        this.publicado = publicado;
    }

    public String getDescripcionPublica() {
        return this.descripcionPublica;
    }

    public void setDescripcionPublica(String descripcionPublica) {
        this.descripcionPublica = descripcionPublica;
    }

    public String getObservacionesInternas() {
        return this.observacionesInternas;
    }

    public void setObservacionesInternas(String observacionesInternas) {
        this.observacionesInternas = observacionesInternas;
    }
}
