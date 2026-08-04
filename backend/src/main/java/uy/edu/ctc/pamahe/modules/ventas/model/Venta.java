package uy.edu.ctc.pamahe.modules.ventas.model;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import uy.edu.ctc.pamahe.common.model.BaseEntity;
import uy.edu.ctc.pamahe.modules.clientes.model.Cliente;
import uy.edu.ctc.pamahe.modules.usuarios.model.Usuario;
import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;

/** Representa el cierre comercial y económico definitivo de un vehículo. */
@Entity
@Table(name = "ventas")
public class Venta extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehiculo_id", nullable = false, unique = true)
    private Vehiculo vehiculo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_comprador_id", nullable = false)
    private Cliente clienteComprador;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vendedor_id", nullable = false)
    private Usuario vendedor;

    @Column(name = "fecha_venta", nullable = false)
    private LocalDate fechaVenta;

    // Estos costos se guardan como fotografía histórica para que la rentabilidad cerrada no cambie.
    @Column(name = "costo_compra_al_vender", nullable = false, precision = 14, scale = 2)
    private BigDecimal costoCompraAlVender;

    @Column(name = "costo_refacciones_al_vender", nullable = false, precision = 14, scale = 2)
    private BigDecimal costoRefaccionesAlVender;

    @Column(name = "costo_total_al_vender", nullable = false, precision = 14, scale = 2)
    private BigDecimal costoTotalAlVender;

    @Column(name = "precio_final", nullable = false, precision = 14, scale = 2)
    private BigDecimal precioFinal;

    @Column(name = "rentabilidad_calculada", nullable = false, precision = 14, scale = 2)
    private BigDecimal rentabilidadCalculada;

    @Column(name = "comprobante_path", length = 500)
    private String comprobantePath;

    @Column(length = 1000)
    private String observaciones;

    public Vehiculo getVehiculo() {
        return this.vehiculo;
    }

    public void setVehiculo(Vehiculo vehiculo) {
        this.vehiculo = vehiculo;
    }

    public Cliente getClienteComprador() {
        return this.clienteComprador;
    }

    public void setClienteComprador(Cliente clienteComprador) {
        this.clienteComprador = clienteComprador;
    }

    public Usuario getVendedor() {
        return this.vendedor;
    }

    public void setVendedor(Usuario vendedor) {
        this.vendedor = vendedor;
    }

    public LocalDate getFechaVenta() {
        return this.fechaVenta;
    }

    public void setFechaVenta(LocalDate fechaVenta) {
        this.fechaVenta = fechaVenta;
    }

    public BigDecimal getCostoCompraAlVender() {
        return this.costoCompraAlVender;
    }

    public void setCostoCompraAlVender(BigDecimal costoCompraAlVender) {
        this.costoCompraAlVender = costoCompraAlVender;
    }

    public BigDecimal getCostoRefaccionesAlVender() {
        return this.costoRefaccionesAlVender;
    }

    public void setCostoRefaccionesAlVender(BigDecimal costoRefaccionesAlVender) {
        this.costoRefaccionesAlVender = costoRefaccionesAlVender;
    }

    public BigDecimal getCostoTotalAlVender() {
        return this.costoTotalAlVender;
    }

    public void setCostoTotalAlVender(BigDecimal costoTotalAlVender) {
        this.costoTotalAlVender = costoTotalAlVender;
    }

    public BigDecimal getPrecioFinal() {
        return this.precioFinal;
    }

    public void setPrecioFinal(BigDecimal precioFinal) {
        this.precioFinal = precioFinal;
    }

    public BigDecimal getRentabilidadCalculada() {
        return this.rentabilidadCalculada;
    }

    public void setRentabilidadCalculada(BigDecimal rentabilidadCalculada) {
        this.rentabilidadCalculada = rentabilidadCalculada;
    }

    public String getComprobantePath() {
        return this.comprobantePath;
    }

    public void setComprobantePath(String comprobantePath) {
        this.comprobantePath = comprobantePath;
    }

    public String getObservaciones() {
        return this.observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }
}
