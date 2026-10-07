package uy.edu.ctc.pamahe.common.performance;

import java.util.LinkedHashMap;
import java.util.Map;

/** Tiempos incrementales por hilo: activo solo dentro del filtro del perfil perf.
 * No almacena entidades, credenciales ni identificadores de negocio.
 */
public final class VentaTiming implements AutoCloseable {
    private static final ThreadLocal<VentaTiming> CURRENT = new ThreadLocal<>();
    private final long start = System.nanoTime();
    private long previous = start;
    private final Map<String, Long> stages = new LinkedHashMap<>();

    private VentaTiming() { }

    public static VentaTiming start() {
        VentaTiming timing = new VentaTiming();
        CURRENT.set(timing);
        return timing;
    }

    public static void mark(String stage) {
        VentaTiming timing = CURRENT.get();
        if (timing != null) {
            long now = System.nanoTime();
            timing.stages.merge(stage, now - timing.previous, Long::sum);
            timing.previous = now;
        }
    }

    public double totalMillis() { return (System.nanoTime() - start) / 1_000_000.0; }

    public Map<String, Double> stageMillis() {
        Map<String, Double> result = new LinkedHashMap<>();
        stages.forEach((name, nanos) -> result.put(name, nanos / 1_000_000.0));
        return result;
    }

    @Override
    public void close() { CURRENT.remove(); }
}
