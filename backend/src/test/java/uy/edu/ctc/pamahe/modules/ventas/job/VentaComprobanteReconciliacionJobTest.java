package uy.edu.ctc.pamahe.modules.ventas.job;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import uy.edu.ctc.pamahe.modules.ventas.event.VentaComprobanteListener;
import uy.edu.ctc.pamahe.modules.ventas.repository.VentaRepository;

@ExtendWith(MockitoExtension.class)
class VentaComprobanteReconciliacionJobTest {

    @Mock VentaRepository repository;
    @Mock VentaComprobanteListener listener;

    @Test
    void reprogramaVentasPendientesPersistidasDespuesDeUnReinicio() {
        when(repository.findIdsComprobantesReintentables(anyList(), anyInt(), any(), any()))
                .thenReturn(List.of(9L, 10L));
        var job = new VentaComprobanteReconciliacionJob(repository, listener);

        job.reconciliar();

        verify(listener).reintentar(9L);
        verify(listener).reintentar(10L);
    }
}
