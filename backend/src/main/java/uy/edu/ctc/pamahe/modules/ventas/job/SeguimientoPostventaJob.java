package uy.edu.ctc.pamahe.modules.ventas.job;

import java.time.LocalDate;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import uy.edu.ctc.pamahe.modules.notificaciones.service.NotificacionService;

/** Genera los recordatorios pendientes de seguimiento postventa. */
@Component
public class SeguimientoPostventaJob {

    private final NotificacionService notificacionService;
    private final int diasSeguimiento;

    public SeguimientoPostventaJob(
            NotificacionService notificacionService,
            @Value("${app.ventas.seguimiento-postventa-dias:7}") int diasSeguimiento) {
        this.notificacionService = notificacionService;
        this.diasSeguimiento = Math.max(1, diasSeguimiento);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void reconciliarAlArranque() {
        reconciliar();
    }

    @Scheduled(cron = "${app.ventas.seguimiento-postventa-cron:0 0 9 * * *}")
    public void reconciliarProgramado() {
        reconciliar();
    }

    void reconciliar() {
        LocalDate fechaLimite = LocalDate.now().minusDays(this.diasSeguimiento);
        this.notificacionService.generarSeguimientosPostventaVencidos(fechaLimite);
    }
}
