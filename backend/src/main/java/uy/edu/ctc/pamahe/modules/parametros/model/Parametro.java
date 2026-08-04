package uy.edu.ctc.pamahe.modules.parametros.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import uy.edu.ctc.pamahe.common.model.BaseEntity;

@Entity
@Table(name = "parametros")
public class Parametro extends BaseEntity {
    @Column(nullable = false, length = 80)
    private String categoria;
    @Column(nullable = false, length = 80)
    private String clave;
    @Column(nullable = false, length = 500)
    private String valor;
    @Column(length = 300)
    private String descripcion;

    public String getCategoria() {
        return this.categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public String getClave() {
        return this.clave;
    }

    public void setClave(String clave) {
        this.clave = clave;
    }

    public String getValor() {
        return this.valor;
    }

    public void setValor(String valor) {
        this.valor = valor;
    }

    public String getDescripcion() {
        return this.descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }
}
