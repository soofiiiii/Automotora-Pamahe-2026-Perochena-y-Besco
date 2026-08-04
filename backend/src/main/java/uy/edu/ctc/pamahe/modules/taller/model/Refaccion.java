package uy.edu.ctc.pamahe.modules.taller.model;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import uy.edu.ctc.pamahe.common.model.BaseEntity;
import uy.edu.ctc.pamahe.modules.usuarios.model.Usuario;
import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;

/** Representa un trabajo que aporta estado operativo y costo acumulado a un vehículo. */
@Entity
@Table(name = "refacciones")
public class Refaccion extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehiculo_id", nullable = false)
    private Vehiculo vehiculo;

    // El ejecutor puede no tener cuenta asignada; quien carga el dato sí debe quedar identificado.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsable_id")
    private Usuario responsableOperativo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_registra_id", nullable = false)
    private Usuario usuarioQueRegistra;

    @Column(nullable = false)
    private LocalDate fecha;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_trabajo", nullable = false, length = 40)
    private TipoTrabajo tipoTrabajo;

    @Column(nullable = false, length = 1000)
    private String descripcion;

    @Column(name = "costo_repuestos", nullable = false, precision = 14, scale = 2)
    private BigDecimal costoRepuestos = BigDecimal.ZERO;

    @Column(name = "costo_mano_obra", nullable = false, precision = 14, scale = 2)
    private BigDecimal costoManoObra = BigDecimal.ZERO;

    @Column(name = "costo_servicios_externos", nullable = false, precision = 14, scale = 2)
    private BigDecimal costoServiciosExternos = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_tarea", nullable = false, length = 30)
    private EstadoTarea estadoTarea = EstadoTarea.PENDIENTE;

    @Column(length = 1000)
    private String observaciones;

    @Column(name = "registro_fotografico_url", length = 500)
    private String registroFotograficoUrl;

    @Column(name = "sincronizado_desde_offline", nullable = false)
    private Boolean sincronizadoDesdeOffline = false;

    // La unicidad convierte los reintentos de sincronización en una operación idempotente.
    @Column(name = "id_operacion_offline", unique = true, length = 100)
    private String idOperacionOffline;

    public Vehiculo getVehiculo() {
        return this.vehiculo;
    }

    public void setVehiculo(Vehiculo vehiculo) {
        this.vehiculo = vehiculo;
    }

    public Usuario getResponsableOperativo() {
        return this.responsableOperativo;
    }

    public void setResponsableOperativo(Usuario responsableOperativo) {
        this.responsableOperativo = responsableOperativo;
    }

    public Usuario getUsuarioQueRegistra() {
        return this.usuarioQueRegistra;
    }

    public void setUsuarioQueRegistra(Usuario usuarioQueRegistra) {
        this.usuarioQueRegistra = usuarioQueRegistra;
    }

    public LocalDate getFecha() {
        return this.fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public TipoTrabajo getTipoTrabajo() {
        return this.tipoTrabajo;
    }

    public void setTipoTrabajo(TipoTrabajo tipoTrabajo) {
        this.tipoTrabajo = tipoTrabajo;
    }

    public String getDescripcion() {
        return this.descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public BigDecimal getCostoRepuestos() {
        return this.costoRepuestos;
    }

    public void setCostoRepuestos(BigDecimal costoRepuestos) {
        this.costoRepuestos = costoRepuestos;
    }

    public BigDecimal getCostoManoObra() {
        return this.costoManoObra;
    }

    public void setCostoManoObra(BigDecimal costoManoObra) {
        this.costoManoObra = costoManoObra;
    }

    public BigDecimal getCostoServiciosExternos() {
        return this.costoServiciosExternos;
    }

    public void setCostoServiciosExternos(BigDecimal costoServiciosExternos) {
        this.costoServiciosExternos = costoServiciosExternos;
    }

    public EstadoTarea getEstadoTarea() {
        return this.estadoTarea;
    }

    public void setEstadoTarea(EstadoTarea estadoTarea) {
        this.estadoTarea = estadoTarea;
    }

    public String getObservaciones() {
        return this.observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    public String getRegistroFotograficoUrl() {
        return this.registroFotograficoUrl;
    }

    public void setRegistroFotograficoUrl(String registroFotograficoUrl) {
        this.registroFotograficoUrl = registroFotograficoUrl;
    }

    public Boolean getSincronizadoDesdeOffline() {
        return this.sincronizadoDesdeOffline;
    }

    public void setSincronizadoDesdeOffline(Boolean sincronizadoDesdeOffline) {
        this.sincronizadoDesdeOffline = sincronizadoDesdeOffline;
    }

    public String getIdOperacionOffline() {
        return this.idOperacionOffline;
    }

    public void setIdOperacionOffline(String idOperacionOffline) {
        this.idOperacionOffline = idOperacionOffline;
    }

    public BigDecimal costoTotal() {
        return this.costoRepuestos.add(this.costoManoObra).add(this.costoServiciosExternos);
    }
}
