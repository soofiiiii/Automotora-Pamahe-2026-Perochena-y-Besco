package uy.edu.ctc.pamahe.modules.solicitudesventa.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import uy.edu.ctc.pamahe.common.model.BaseEntity;

@Entity
@Table(name = "solicitudes_venta_imagenes")
public class SolicitudVentaImagen extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "solicitud_id", nullable = false)
    private SolicitudVentaVehiculo solicitud;

    @Column(name = "ruta_archivo", nullable = false, length = 500)
    private String rutaArchivo;

    public SolicitudVentaVehiculo getSolicitud() { return solicitud; }
    public void setSolicitud(SolicitudVentaVehiculo solicitud) { this.solicitud = solicitud; }
    public String getRutaArchivo() { return rutaArchivo; }
    public void setRutaArchivo(String rutaArchivo) { this.rutaArchivo = rutaArchivo; }
}
