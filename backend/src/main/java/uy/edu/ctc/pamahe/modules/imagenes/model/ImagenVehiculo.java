package uy.edu.ctc.pamahe.modules.imagenes.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import uy.edu.ctc.pamahe.common.model.BaseEntity;
import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;

/** Conserva la ruta relativa y la política de exposición de cada imagen del vehículo. */
@Entity
@Table(name = "imagenes_vehiculo")
public class ImagenVehiculo extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehiculo_id", nullable = false)
    private Vehiculo vehiculo;

    @Column(name = "ruta_archivo", nullable = false, length = 500)
    private String rutaArchivo;

    @Column(length = 200)
    private String descripcion;

    @Column(nullable = false)
    private Boolean publica = false;

    @Column(nullable = false)
    private Boolean principal = false;

    public Vehiculo getVehiculo() {
        return this.vehiculo;
    }

    public void setVehiculo(Vehiculo vehiculo) {
        this.vehiculo = vehiculo;
    }

    public String getRutaArchivo() {
        return this.rutaArchivo;
    }

    public void setRutaArchivo(String rutaArchivo) {
        this.rutaArchivo = rutaArchivo;
    }

    public String getDescripcion() {
        return this.descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public Boolean getPublica() {
        return this.publica;
    }

    public void setPublica(Boolean publica) {
        this.publica = publica;
    }

    public Boolean getPrincipal() {
        return this.principal;
    }

    public void setPrincipal(Boolean principal) {
        this.principal = principal;
    }

    //  Solo produce una URL estática cuando metadatos y ubicación física coinciden en que es pública.
    public String getUrlPublica() {
        if (!Boolean.TRUE.equals(this.publica) || this.rutaArchivo == null || !this.rutaArchivo.startsWith("public/")) {
            return null;
        }
        return "/uploads/" + this.rutaArchivo;
    }

    // La URL interna apunta a un endpoint autenticado en lugar de exponer la ruta privada.
    public String getUrlInterna() {
        return this.getId() == null ? null : "/api/imagenes/" + this.getId() + "/archivo";
    }
}
