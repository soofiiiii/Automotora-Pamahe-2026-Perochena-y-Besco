package uy.edu.ctc.pamahe.modules.auditoria.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import uy.edu.ctc.pamahe.common.model.BaseEntity;

@Entity
@Table(name = "auditoria")
public class Auditoria extends BaseEntity {

    @Column(nullable = false, length = 80)
    private String usuario;

    @Column(nullable = false, length = 50)
    private String accion;

    @Column(nullable = false, length = 80)
    private String entidad;

    @Column(name = "entidad_id")
    private Long entidadId;

    @Column(length = 1000)
    private String detalle;

    @Column(name = "valores_anteriores", columnDefinition = "TEXT")
    private String valoresAnteriores;

    @Column(name = "valores_nuevos", columnDefinition = "TEXT")
    private String valoresNuevos;

    public String getUsuario() {
        return this.usuario;
    }

    public void setUsuario(String usuario) {
        this.usuario = usuario;
    }

    public String getAccion() {
        return this.accion;
    }

    public void setAccion(String accion) {
        this.accion = accion;
    }

    public String getEntidad() {
        return this.entidad;
    }

    public void setEntidad(String entidad) {
        this.entidad = entidad;
    }

    public Long getEntidadId() {
        return this.entidadId;
    }

    public void setEntidadId(Long entidadId) {
        this.entidadId = entidadId;
    }

    public String getDetalle() {
        return this.detalle;
    }

    public void setDetalle(String detalle) {
        this.detalle = detalle;
    }

    public String getValoresAnteriores() {
        return this.valoresAnteriores;
    }

    public void setValoresAnteriores(String valoresAnteriores) {
        this.valoresAnteriores = valoresAnteriores;
    }

    public String getValoresNuevos() {
        return this.valoresNuevos;
    }

    public void setValoresNuevos(String valoresNuevos) {
        this.valoresNuevos = valoresNuevos;
    }
}
