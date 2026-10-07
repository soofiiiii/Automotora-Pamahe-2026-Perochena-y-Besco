package uy.edu.ctc.pamahe.modules.compras.model;

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

/** Marca el único ingreso comercial de una unidad al inventario. */
@Entity
@Table(name = "compras")
public class Compra extends BaseEntity {

    // Una unidad solo puede tener una compra de origen dentro de su ciclo gestionado.
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehiculo_id", nullable = false, unique = true)
    private Vehiculo vehiculo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_vendedor_id", nullable = false)
    private Cliente clienteVendedor;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_responsable_id", nullable = false)
    private Usuario usuarioResponsable;

    @Column(name = "fecha_compra", nullable = false)
    private LocalDate fechaCompra;

    @Column(name = "costo_adquisicion", nullable = false, precision = 14, scale = 2)
    private BigDecimal costoAdquisicion;

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

    public Cliente getClienteVendedor() {
        return this.clienteVendedor;
    }

    public void setClienteVendedor(Cliente clienteVendedor) {
        this.clienteVendedor = clienteVendedor;
    }

    public Usuario getUsuarioResponsable() {
        return this.usuarioResponsable;
    }

    public void setUsuarioResponsable(Usuario usuarioResponsable) {
        this.usuarioResponsable = usuarioResponsable;
    }

    public LocalDate getFechaCompra() {
        return this.fechaCompra;
    }

    public void setFechaCompra(LocalDate fechaCompra) {
        this.fechaCompra = fechaCompra;
    }

    public BigDecimal getCostoAdquisicion() {
        return this.costoAdquisicion;
    }

    public void setCostoAdquisicion(BigDecimal costoAdquisicion) {
        this.costoAdquisicion = costoAdquisicion;
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