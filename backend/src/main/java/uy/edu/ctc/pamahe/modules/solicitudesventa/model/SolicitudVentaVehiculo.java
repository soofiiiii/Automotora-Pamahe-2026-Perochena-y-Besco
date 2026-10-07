package uy.edu.ctc.pamahe.modules.solicitudesventa.model;

import java.time.LocalDateTime;

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

@Entity
@Table(name = "solicitudes_venta_vehiculo")
public class SolicitudVentaVehiculo extends BaseEntity {

    @Column(nullable = false, length = 120)
    private String nombre;

    @Column(nullable = false, length = 40)
    private String telefono;

    @Column(nullable = false, length = 80)
    private String marca;

    @Column(nullable = false, length = 80)
    private String modelo;

    @Column(nullable = false)
    private Integer anio;

    @Column(nullable = false)
    private Integer kilometraje;

    @Column(length = 1000)
    private String observaciones;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EstadoSolicitudVenta estado = EstadoSolicitudVenta.PENDIENTE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "revisada_por")
    private Usuario revisadaPor;

    @Column(name = "revisada_en")
    private LocalDateTime revisadaEn;

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }
    public String getMarca() { return marca; }
    public void setMarca(String marca) { this.marca = marca; }
    public String getModelo() { return modelo; }
    public void setModelo(String modelo) { this.modelo = modelo; }
    public Integer getAnio() { return anio; }
    public void setAnio(Integer anio) { this.anio = anio; }
    public Integer getKilometraje() { return kilometraje; }
    public void setKilometraje(Integer kilometraje) { this.kilometraje = kilometraje; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
    public EstadoSolicitudVenta getEstado() { return estado; }
    public void setEstado(EstadoSolicitudVenta estado) { this.estado = estado; }
    public Usuario getRevisadaPor() { return revisadaPor; }
    public void setRevisadaPor(Usuario revisadaPor) { this.revisadaPor = revisadaPor; }
    public LocalDateTime getRevisadaEn() { return revisadaEn; }
    public void setRevisadaEn(LocalDateTime revisadaEn) { this.revisadaEn = revisadaEn; }
}
