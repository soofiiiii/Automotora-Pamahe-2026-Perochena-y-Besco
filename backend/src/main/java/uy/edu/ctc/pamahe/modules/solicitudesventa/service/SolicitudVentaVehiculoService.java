package uy.edu.ctc.pamahe.modules.solicitudesventa.service;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.common.exception.ResourceNotFoundException;
import uy.edu.ctc.pamahe.modules.auditoria.service.AuditoriaService;
import uy.edu.ctc.pamahe.modules.imagenes.service.FileStorageService;
import uy.edu.ctc.pamahe.modules.solicitudesventa.dto.request.ActualizarEstadoSolicitudVentaRequest;
import uy.edu.ctc.pamahe.modules.solicitudesventa.dto.request.SolicitudVentaPublicaRequest;
import uy.edu.ctc.pamahe.modules.solicitudesventa.dto.response.SolicitudVentaDetalleResponse;
import uy.edu.ctc.pamahe.modules.solicitudesventa.dto.response.SolicitudVentaImagenResponse;
import uy.edu.ctc.pamahe.modules.solicitudesventa.dto.response.SolicitudVentaPublicaResponse;
import uy.edu.ctc.pamahe.modules.solicitudesventa.dto.response.SolicitudVentaResumenResponse;
import uy.edu.ctc.pamahe.modules.solicitudesventa.model.EstadoSolicitudVenta;
import uy.edu.ctc.pamahe.modules.solicitudesventa.model.SolicitudVentaImagen;
import uy.edu.ctc.pamahe.modules.solicitudesventa.model.SolicitudVentaVehiculo;
import uy.edu.ctc.pamahe.modules.solicitudesventa.repository.SolicitudVentaImagenRepository;
import uy.edu.ctc.pamahe.modules.solicitudesventa.repository.SolicitudVentaVehiculoRepository;
import uy.edu.ctc.pamahe.modules.usuarios.model.Usuario;
import uy.edu.ctc.pamahe.modules.usuarios.service.UsuarioActualService;

@Service
public class SolicitudVentaVehiculoService {

    private static final int MAX_FOTOGRAFIAS = 5;

    private final SolicitudVentaVehiculoRepository solicitudRepository;
    private final SolicitudVentaImagenRepository imagenRepository;
    private final FileStorageService fileStorageService;
    private final UsuarioActualService usuarioActualService;
    private final AuditoriaService auditoriaService;

    public SolicitudVentaVehiculoService(
            SolicitudVentaVehiculoRepository solicitudRepository,
            SolicitudVentaImagenRepository imagenRepository,
            FileStorageService fileStorageService,
            UsuarioActualService usuarioActualService,
            AuditoriaService auditoriaService) {
        this.solicitudRepository = solicitudRepository;
        this.imagenRepository = imagenRepository;
        this.fileStorageService = fileStorageService;
        this.usuarioActualService = usuarioActualService;
        this.auditoriaService = auditoriaService;
    }

    @Transactional
    public SolicitudVentaPublicaResponse crearPublica(SolicitudVentaPublicaRequest request) {
        List<MultipartFile> fotografias = request.getFotografias();
        if (fotografias == null || fotografias.isEmpty()) {
            throw new BusinessException("Adjuntá al menos una fotografía del vehículo.");
        }
        if (fotografias.size() > MAX_FOTOGRAFIAS) {
            throw new BusinessException("Podés adjuntar hasta 5 fotografías.");
        }
        if (fotografias.stream().anyMatch(file -> file == null || file.isEmpty())) {
            throw new BusinessException("Las fotografías adjuntas no pueden estar vacías.");
        }
        validarAnio(request.getAnio());

        SolicitudVentaVehiculo solicitud = new SolicitudVentaVehiculo();
        solicitud.setNombre(normalizarRequerido(request.getNombre()));
        solicitud.setTelefono(normalizarTelefono(request.getTelefono()));
        solicitud.setMarca(normalizarRequerido(request.getMarca()));
        solicitud.setModelo(normalizarRequerido(request.getModelo()));
        solicitud.setAnio(request.getAnio());
        solicitud.setKilometraje(request.getKilometraje());
        solicitud.setObservaciones(normalizarOpcional(request.getObservaciones()));
        solicitud.setEstado(EstadoSolicitudVenta.PENDIENTE);

        SolicitudVentaVehiculo guardada = this.solicitudRepository.saveAndFlush(solicitud);
        for (MultipartFile fotografia : fotografias) {
            FileStorageService.StoredImage almacenada = this.fileStorageService
                    .guardarImagenSolicitudVenta(guardada.getId(), fotografia);
            SolicitudVentaImagen imagen = new SolicitudVentaImagen();
            imagen.setSolicitud(guardada);
            imagen.setRutaArchivo(almacenada.relativePath());
            this.imagenRepository.save(imagen);
        }

        return new SolicitudVentaPublicaResponse(
                guardada.getId(), guardada.getEstado(), guardada.getCreadoEn());
    }

    @Transactional(readOnly = true)
    public List<SolicitudVentaResumenResponse> listarInternas() {
        this.usuarioActualService.exigirRoles("ADMINISTRADOR", "DUENO", "VENDEDOR");
        return this.solicitudRepository.findByActivoTrueOrderByCreadoEnDesc().stream()
                .map(this::toResumen)
                .toList();
    }

    @Transactional(readOnly = true)
    public SolicitudVentaDetalleResponse obtenerInterna(Long id) {
        this.usuarioActualService.exigirRoles("ADMINISTRADOR", "DUENO", "VENDEDOR");
        return toDetalle(buscarActiva(id));
    }

    @Transactional
    public SolicitudVentaDetalleResponse actualizarEstado(
            Long id,
            ActualizarEstadoSolicitudVentaRequest request) {
        Usuario usuario = this.usuarioActualService.exigirRoles("ADMINISTRADOR", "DUENO", "VENDEDOR");
        SolicitudVentaVehiculo solicitud = buscarActiva(id);
        EstadoSolicitudVenta anterior = solicitud.getEstado();
        solicitud.setEstado(request.estado());
        if (request.estado() == EstadoSolicitudVenta.PENDIENTE) {
            solicitud.setRevisadaPor(null);
            solicitud.setRevisadaEn(null);
        } else {
            solicitud.setRevisadaPor(usuario);
            solicitud.setRevisadaEn(LocalDateTime.now());
        }
        SolicitudVentaVehiculo guardada = this.solicitudRepository.save(solicitud);
        this.auditoriaService.registrar(
                "CAMBIO_ESTADO",
                "SolicitudVentaVehiculo",
                guardada.getId(),
                "Actualización del estado de revisión de solicitud pública.",
                "estado=" + anterior,
                "estado=" + guardada.getEstado());
        return toDetalle(guardada);
    }

    @Transactional(readOnly = true)
    public FileStorageService.StoredResource cargarFotografia(Long solicitudId, Long imagenId) {
        this.usuarioActualService.exigirRoles("ADMINISTRADOR", "DUENO", "VENDEDOR");
        SolicitudVentaVehiculo solicitud = buscarActiva(solicitudId);
        SolicitudVentaImagen imagen = this.imagenRepository
                .findByIdAndSolicitudAndActivoTrue(imagenId, solicitud)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró la fotografía solicitada."));
        return this.fileStorageService.cargar(imagen.getRutaArchivo());
    }

    private SolicitudVentaVehiculo buscarActiva(Long id) {
        SolicitudVentaVehiculo solicitud = this.solicitudRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró la solicitud indicada."));
        if (!Boolean.TRUE.equals(solicitud.getActivo())) {
            throw new ResourceNotFoundException("La solicitud indicada ya no está disponible.");
        }
        return solicitud;
    }

    private SolicitudVentaResumenResponse toResumen(SolicitudVentaVehiculo solicitud) {
        return new SolicitudVentaResumenResponse(
                solicitud.getId(),
                solicitud.getNombre(),
                solicitud.getTelefono(),
                solicitud.getMarca(),
                solicitud.getModelo(),
                solicitud.getAnio(),
                solicitud.getKilometraje(),
                solicitud.getEstado(),
                this.imagenRepository.countBySolicitudAndActivoTrue(solicitud),
                solicitud.getCreadoEn());
    }

    private SolicitudVentaDetalleResponse toDetalle(SolicitudVentaVehiculo solicitud) {
        List<SolicitudVentaImagenResponse> fotografias = this.imagenRepository
                .findBySolicitudAndActivoTrueOrderByIdAsc(solicitud).stream()
                .map(imagen -> new SolicitudVentaImagenResponse(
                        imagen.getId(),
                        "/solicitudes-venta/" + solicitud.getId() + "/imagenes/" + imagen.getId()))
                .toList();
        Usuario revisora = solicitud.getRevisadaPor();
        return new SolicitudVentaDetalleResponse(
                solicitud.getId(),
                solicitud.getNombre(),
                solicitud.getTelefono(),
                solicitud.getMarca(),
                solicitud.getModelo(),
                solicitud.getAnio(),
                solicitud.getKilometraje(),
                solicitud.getObservaciones(),
                solicitud.getEstado(),
                revisora == null ? null : revisora.getId(),
                revisora == null ? null : revisora.getNombre(),
                solicitud.getRevisadaEn(),
                solicitud.getCreadoEn(),
                fotografias);
    }

    private void validarAnio(Integer anio) {
        int maximo = Year.now().getValue();
        if (anio == null || anio < 1900 || anio > maximo) {
            throw new BusinessException(
                    "El año del vehículo debe estar entre 1900 y " + maximo + ".");
        }
    }

    private String normalizarRequerido(String valor) {
        return valor == null ? null : valor.trim();
    }

    private String normalizarOpcional(String valor) {
        if (valor == null)
            return null;
        String limpio = valor.trim();
        return limpio.isEmpty() ? null : limpio;
    }

    private String normalizarTelefono(String telefono) {
        if (telefono == null || telefono.isBlank()) {
            throw new BusinessException("Ingresá un teléfono válido.");
        }

        String limpio = telefono.trim().replaceAll("[\\s()-]", "");

        if (!limpio.matches("\\+?\\d{8,15}")) {
            throw new BusinessException("Ingresá un teléfono válido.");
        }

        return limpio;
    }
}
