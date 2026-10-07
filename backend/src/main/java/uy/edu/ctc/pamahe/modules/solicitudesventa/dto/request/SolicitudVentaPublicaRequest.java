package uy.edu.ctc.pamahe.modules.solicitudesventa.dto.request;

import java.util.ArrayList;
import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class SolicitudVentaPublicaRequest {

    @NotBlank(message = "Ingresá tu nombre.")
    @Size(max = 120, message = "El nombre no puede superar los 120 caracteres.")
    private String nombre;

    @NotBlank(message = "Ingresá un teléfono de contacto.")
    @Size(max = 40, message = "El teléfono no puede superar los 40 caracteres.")
    @Pattern(regexp = "^\\+?[0-9 ()-]{8,40}$", message = "Ingresá un teléfono válido.")
    private String telefono;

    @NotBlank(message = "Ingresá la marca del vehículo.")
    @Size(max = 80, message = "La marca no puede superar los 80 caracteres.")
    private String marca;

    @NotBlank(message = "Ingresá el modelo del vehículo.")
    @Size(max = 80, message = "El modelo no puede superar los 80 caracteres.")
    private String modelo;

    @NotNull(message = "Ingresá el año del vehículo.")
    @Min(value = 1900, message = "El año no puede ser anterior a 1900.")
    @Max(value = 2100, message = "El año no puede ser posterior a 2100.")
    private Integer anio;

    @NotNull(message = "Ingresá el kilometraje del vehículo.")
    @PositiveOrZero(message = "El kilometraje no puede ser negativo.")
    private Integer kilometraje;

    @Size(max = 1000, message = "Las observaciones no pueden superar los 1000 caracteres.")
    private String observaciones;

    @NotEmpty(message = "Adjuntá al menos una fotografía del vehículo.")
    @Size(max = 5, message = "Podés adjuntar hasta 5 fotografías.")
    private List<MultipartFile> fotografias = new ArrayList<>();

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
    public List<MultipartFile> getFotografias() { return fotografias; }
    public void setFotografias(List<MultipartFile> fotografias) { this.fotografias = fotografias; }
}
