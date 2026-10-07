package uy.edu.ctc.pamahe.common.response;

import java.util.List;
import java.util.function.Function;

import org.springframework.data.domain.Page;

/**
 * Contrato estable de paginación para no exponer directamente tipos internos de Spring Data.
*/
public record PageResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last) {

    public static <S, T> PageResponse<T> from(Page<S> source, Function<S, T> mapper) {
        return new PageResponse<>(
                source.getContent().stream().map(mapper).toList(),
                source.getNumber(),
                source.getSize(),
                source.getTotalElements(),
                source.getTotalPages(),
                source.isFirst(),
                source.isLast());
    }
}

