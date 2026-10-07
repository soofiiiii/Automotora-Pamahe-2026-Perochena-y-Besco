package uy.edu.ctc.pamahe.modules.ventas.job;

import java.time.LocalDate;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import uy.edu.ctc.pamahe.modules.notificaciones.service.NotificacionService;

/** Genera avisos internos cuando se aproxima el mantenimiento indicado en una venta. */
@Component
public class ProximoMantenimientoJob {

    private final NotificacionService notificacionService;
    private final int diasAviso;

    public ProximoMantenimientoJob(
            NotificacionService notificacionService,
            @Value("${app.ventas.mantenimiento-aviso-dias:7}") int diasAviso) {
        this.notificacionService = notificacionService;
        this.diasAviso = Math.max(0, diasAviso);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void reconciliarAlArranque() {
        reconciliar();
    }

    @Scheduled(cron = "${app.ventas.mantenimiento-cron:0 15 9 * * *}")
    public void reconciliarProgramado() {
        reconciliar();
    }

    void reconciliar() {
        this.notificacionService.generarProximosMantenimientos(LocalDate.now().plusDays(this.diasAviso));
    }
}
