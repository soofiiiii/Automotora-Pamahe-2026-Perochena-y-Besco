package uy.edu.ctc.pamahe.modules.ventas.job;

import static org.mockito.Mockito.verify;

import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import uy.edu.ctc.pamahe.modules.notificaciones.service.NotificacionService;

@ExtendWith(MockitoExtension.class)
class SeguimientoPostventaJobTest {

    @Mock
    NotificacionService notificacionService;

    @Test
    void usaLaCantidadFijaDeDiasConfigurada() {
        SeguimientoPostventaJob job = new SeguimientoPostventaJob(notificacionService, 7);

        job.reconciliar();

        verify(notificacionService).generarSeguimientosPostventaVencidos(LocalDate.now().minusDays(7));
    }

    @Test
    void normalizaConfiguracionesMenoresAUnDia() {
        SeguimientoPostventaJob job = new SeguimientoPostventaJob(notificacionService, 0);

        job.reconciliar();

        verify(notificacionService).generarSeguimientosPostventaVencidos(LocalDate.now().minusDays(1));
    }
}
