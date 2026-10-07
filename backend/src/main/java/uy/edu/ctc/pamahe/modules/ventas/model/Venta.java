package uy.edu.ctc.pamahe.modules.ventas.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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

    @Enumerated(EnumType.STRING)
    @Column(name = "medio_pago", length = 40)
    private MedioPagoVenta medioPago;

    @Column(name = "entidad_financiera", length = 120)
    private String entidadFinanciera;

    @Column(name = "monto_financiado", precision = 14, scale = 2)
    private BigDecimal montoFinanciado;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_financiacion", length = 20)
    private EstadoFinanciacion estadoFinanciacion;

    @Enumerated(EnumType.STRING)
    @Column(name = "canal_origen", length = 30)
    private CanalOrigenVenta canalOrigen;

    @Column(name = "seguimiento_postventa_realizado", nullable = false)
    private Boolean seguimientoPostventaRealizado = false;

    @Column(name = "datos_comprador_verificados", nullable = false)
    private Boolean datosCompradorVerificados = false;

    @Column(name = "documentacion_revisada", nullable = false)
    private Boolean documentacionRevisada = false;

    @Column(name = "cobro_confirmado", nullable = false)
    private Boolean cobroConfirmado = false;

    @Column(name = "proximo_mantenimiento")
    private LocalDate proximoMantenimiento;

    @Column(name = "rentabilidad_calculada", nullable = false, precision = 14, scale = 2)
    private BigDecimal rentabilidadCalculada;

    @Column(name = "comprobante_path", length = 500)
    private String comprobantePath;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_comprobante", nullable = false, length = 20)
    private EstadoComprobanteVenta estadoComprobante = EstadoComprobanteVenta.PENDIENTE;

    @Column(name = "intentos_comprobante", nullable = false)
    private Integer intentosComprobante = 0;

    @Column(name = "ultimo_intento_comprobante")
    private LocalDateTime ultimoIntentoComprobante;

    @Column(name = "proximo_intento_comprobante")
    private LocalDateTime proximoIntentoComprobante;

    @Column(name = "error_comprobante", length = 1000)
    private String errorComprobante;

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

    public MedioPagoVenta getMedioPago() {
        return this.medioPago;
    }

    public void setMedioPago(MedioPagoVenta medioPago) {
        this.medioPago = medioPago;
    }

    public String getEntidadFinanciera() {
        return this.entidadFinanciera;
    }

    public void setEntidadFinanciera(String entidadFinanciera) {
        this.entidadFinanciera = entidadFinanciera;
    }

    public BigDecimal getMontoFinanciado() {
        return this.montoFinanciado;
    }

    public void setMontoFinanciado(BigDecimal montoFinanciado) {
        this.montoFinanciado = montoFinanciado;
    }

    public EstadoFinanciacion getEstadoFinanciacion() {
        return this.estadoFinanciacion;
    }

    public void setEstadoFinanciacion(EstadoFinanciacion estadoFinanciacion) {
        this.estadoFinanciacion = estadoFinanciacion;
    }

    public CanalOrigenVenta getCanalOrigen() {
        return this.canalOrigen;
    }

    public void setCanalOrigen(CanalOrigenVenta canalOrigen) {
        this.canalOrigen = canalOrigen;
    }

    public Boolean getSeguimientoPostventaRealizado() {
        return this.seguimientoPostventaRealizado;
    }

    public void setSeguimientoPostventaRealizado(Boolean seguimientoPostventaRealizado) {
        this.seguimientoPostventaRealizado = seguimientoPostventaRealizado;
    }

    public Boolean getDatosCompradorVerificados() {
        return this.datosCompradorVerificados;
    }

    public void setDatosCompradorVerificados(Boolean datosCompradorVerificados) {
        this.datosCompradorVerificados = datosCompradorVerificados;
    }

    public Boolean getDocumentacionRevisada() {
        return this.documentacionRevisada;
    }

    public void setDocumentacionRevisada(Boolean documentacionRevisada) {
        this.documentacionRevisada = documentacionRevisada;
    }

    public Boolean getCobroConfirmado() {
        return this.cobroConfirmado;
    }

    public void setCobroConfirmado(Boolean cobroConfirmado) {
        this.cobroConfirmado = cobroConfirmado;
    }

    public LocalDate getProximoMantenimiento() {
        return this.proximoMantenimiento;
    }

    public void setProximoMantenimiento(LocalDate proximoMantenimiento) {
        this.proximoMantenimiento = proximoMantenimiento;
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

    public EstadoComprobanteVenta getEstadoComprobante() {
        return this.estadoComprobante;
    }

    public void setEstadoComprobante(EstadoComprobanteVenta estadoComprobante) {
        this.estadoComprobante = estadoComprobante;
    }

    public Integer getIntentosComprobante() {
        return this.intentosComprobante;
    }

    public void setIntentosComprobante(Integer intentosComprobante) {
        this.intentosComprobante = intentosComprobante;
    }

    public LocalDateTime getUltimoIntentoComprobante() {
        return this.ultimoIntentoComprobante;
    }

    public void setUltimoIntentoComprobante(LocalDateTime ultimoIntentoComprobante) {
        this.ultimoIntentoComprobante = ultimoIntentoComprobante;
    }

    public LocalDateTime getProximoIntentoComprobante() {
        return this.proximoIntentoComprobante;
    }

    public void setProximoIntentoComprobante(LocalDateTime proximoIntentoComprobante) {
        this.proximoIntentoComprobante = proximoIntentoComprobante;
    }

    public String getErrorComprobante() {
        return this.errorComprobante;
    }

    public void setErrorComprobante(String errorComprobante) {
        this.errorComprobante = errorComprobante;
    }

    public String getObservaciones() {
        return this.observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }
}
