package uy.edu.ctc.pamahe.modules.taller.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import uy.edu.ctc.pamahe.modules.taller.model.EstadoTarea;
import uy.edu.ctc.pamahe.modules.taller.model.TipoTrabajo;

public record RefaccionResponse(
        Long id,
        Long vehiculoId,
        String vehiculo,
        Long responsableOperativoId,
        String responsableOperativo,
        Long usuarioQueRegistraId,
        String usuarioQueRegistra,
        LocalDate fecha,
        TipoTrabajo tipoTrabajo,
        String descripcion,
        BigDecimal costoRepuestos,
        BigDecimal costoManoObra,
        BigDecimal costoServiciosExternos,
        BigDecimal costoTotal,
        EstadoTarea estadoTarea,
        String observaciones,
        String registroFotograficoUrl,
        Boolean sincronizadoDesdeOffline,
        String idOperacionOffline
) {
}
