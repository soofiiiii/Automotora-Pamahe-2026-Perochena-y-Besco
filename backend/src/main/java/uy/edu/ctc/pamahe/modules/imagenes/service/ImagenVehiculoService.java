package uy.edu.ctc.pamahe.modules.imagenes.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.common.exception.ResourceNotFoundException;
import uy.edu.ctc.pamahe.modules.auditoria.service.AuditoriaService;
import uy.edu.ctc.pamahe.modules.imagenes.dto.request.ActualizarVisibilidadImagenRequest;
import uy.edu.ctc.pamahe.modules.imagenes.dto.response.ImagenVehiculoResponse;
import uy.edu.ctc.pamahe.modules.imagenes.mapper.ImagenVehiculoMapper;
import uy.edu.ctc.pamahe.modules.imagenes.model.ImagenVehiculo;
import uy.edu.ctc.pamahe.modules.imagenes.repository.ImagenVehiculoRepository;
import uy.edu.ctc.pamahe.modules.usuarios.service.UsuarioActualService;
import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.service.VehiculoService;

/**
 * Coordina metadatos y archivo físico manteniendo las imágenes privadas por defecto.
 * La publicación requiere una acción explícita y conserva como máximo una imagen principal por vehículo.
 */
@Service
public class ImagenVehiculoService {

    private final ImagenVehiculoRepository imagenVehiculoRepository;
    private final VehiculoService vehiculoService;
    private final UsuarioActualService usuarioActualService;
    private final FileStorageService fileStorageService;
    private final AuditoriaService auditoriaService;

    public ImagenVehiculoService(ImagenVehiculoRepository imagenVehiculoRepository,
            VehiculoService vehiculoService,
            UsuarioActualService usuarioActualService,
            FileStorageService fileStorageService,
            AuditoriaService auditoriaService) {
        this.imagenVehiculoRepository = imagenVehiculoRepository;
        this.vehiculoService = vehiculoService;
        this.usuarioActualService = usuarioActualService;
        this.fileStorageService = fileStorageService;
        this.auditoriaService = auditoriaService;
    }

    @Transactional(readOnly = true)
    public List<ImagenVehiculoResponse> listarPorVehiculo(Long vehiculoId) {
        Vehiculo vehiculo = this.vehiculoService.buscarActivoPorId(vehiculoId);
        return this.imagenVehiculoRepository.findByVehiculoAndActivoTrueOrderByPrincipalDescIdAsc(vehiculo).stream()
                .map(ImagenVehiculoMapper::toResponse)
                .toList();
    }

    @Transactional
    public ImagenVehiculoResponse subir(Long vehiculoId, MultipartFile file, String descripcion) {
        this.usuarioActualService.exigirRoles("ADMINISTRADOR", "DUENO", "VENDEDOR", "TALLER");
        Vehiculo vehiculo = this.vehiculoService.buscarActivoPorId(vehiculoId);
        FileStorageService.StoredImage almacenada = this.fileStorageService.guardarImagenPrivada(vehiculoId, file);

        ImagenVehiculo imagen = new ImagenVehiculo();
        imagen.setVehiculo(vehiculo);
        imagen.setRutaArchivo(almacenada.relativePath());
        imagen.setDescripcion(this.normalizarDescripcion(descripcion));
        // Una carga nueva no se expone hasta que un rol comercial revise y habilite su uso público.
        imagen.setPublica(false);
        imagen.setPrincipal(false);

        ImagenVehiculo guardada = this.imagenVehiculoRepository.save(imagen);
        this.auditoriaService.registrar(
                "ALTA",
                "ImagenVehiculo",
                guardada.getId(),
                "Imagen privada asociada al vehículo " + vehiculoId,
                null,
                "vehiculoId=" + vehiculoId + ", publica=false, principal=false");
        return ImagenVehiculoMapper.toResponse(guardada);
    }

    @Transactional
    public ImagenVehiculoResponse actualizarVisibilidad(Long id, ActualizarVisibilidadImagenRequest request) {
        this.usuarioActualService.exigirRoles("ADMINISTRADOR", "DUENO", "VENDEDOR");
        ImagenVehiculo imagen = this.buscarActiva(id);
        boolean publicaAnterior = Boolean.TRUE.equals(imagen.getPublica());
        boolean principalAnterior = Boolean.TRUE.equals(imagen.getPrincipal());

        // Una principal privada sería incoherente: el catálogo no podría mostrarla.
        if (Boolean.TRUE.equals(request.principal()) && !Boolean.TRUE.equals(request.publica())) {
            throw new BusinessException("Una imagen principal debe ser pública.");
        }

        if (publicaAnterior != Boolean.TRUE.equals(request.publica())) {
            String nuevaRuta = this.fileStorageService.moverVisibilidad(
                    imagen.getRutaArchivo(),
                    imagen.getVehiculo().getId(),
                    Boolean.TRUE.equals(request.publica()));
            imagen.setRutaArchivo(nuevaRuta);
        }

        boolean seraPrincipal = Boolean.TRUE.equals(request.publica()) && Boolean.TRUE.equals(request.principal());
        if (seraPrincipal) {
            this.imagenVehiculoRepository.quitarPrincipalDeOtras(imagen.getVehiculo(), imagen.getId());
        }
        imagen.setPublica(request.publica());
        imagen.setPrincipal(seraPrincipal);
        ImagenVehiculo guardada = this.imagenVehiculoRepository.saveAndFlush(imagen);

        this.auditoriaService.registrar(
                "CAMBIO_VISIBILIDAD",
                "ImagenVehiculo",
                guardada.getId(),
                "Actualización de visibilidad de imagen",
                "publica=" + publicaAnterior + ", principal=" + principalAnterior,
                "publica=" + guardada.getPublica() + ", principal=" + guardada.getPrincipal());
        return ImagenVehiculoMapper.toResponse(this.buscarActiva(id));
    }

    @Transactional(readOnly = true)
    public FileStorageService.StoredResource cargarArchivoInterno(Long id) {
        ImagenVehiculo imagen = this.buscarActiva(id);
        return this.fileStorageService.cargar(imagen.getRutaArchivo());
    }

    @Transactional
    public void eliminarDefinitivamente(Long id) {
        this.usuarioActualService.exigirRoles("ADMINISTRADOR", "DUENO");
        ImagenVehiculo imagen = this.buscarActiva(id);
        String ruta = imagen.getRutaArchivo();
        String anterior = "vehiculoId=" + imagen.getVehiculo().getId()
                + ", publica=" + imagen.getPublica()
                + ", principal=" + imagen.getPrincipal();
        // Se confirma primero la eliminación relacional; el archivo físico se borra únicamente tras el commit.
        this.imagenVehiculoRepository.delete(imagen);
        this.imagenVehiculoRepository.flush();
        this.fileStorageService.eliminarTrasCommit(ruta);
        this.auditoriaService.registrar(
                "ELIMINACION",
                "ImagenVehiculo",
                id,
                "Eliminación definitiva de imagen y archivo físico",
                anterior,
                null
        );
    }

    private ImagenVehiculo buscarActiva(Long id) {
        ImagenVehiculo imagen = this.imagenVehiculoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró la imagen solicitada."));
        if (!Boolean.TRUE.equals(imagen.getActivo())) {
            throw new ResourceNotFoundException("No se encontró una imagen activa con el identificador solicitado.");
        }
        return imagen;
    }

    private String normalizarDescripcion(String descripcion) {
        if (descripcion == null) {
            return null;
        }
        String limpia = descripcion.trim();
        return limpia.isEmpty() ? null : limpia;
    }

}
