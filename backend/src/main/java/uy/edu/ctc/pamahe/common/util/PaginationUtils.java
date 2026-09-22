package uy.edu.ctc.pamahe.common.util;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import uy.edu.ctc.pamahe.common.exception.BusinessException;

public final class PaginationUtils {

    public static final int DEFAULT_SIZE = 20;
    public static final int MAX_SIZE = 100;

    private PaginationUtils() {
    }

    public static Pageable of(int page, int size) {
        if (page < 0) {
            throw new BusinessException("El número de página no puede ser negativo.");
        }

        if (size < 1 || size > MAX_SIZE) {
            throw new BusinessException(
                    "El tamaño de página debe estar entre 1 y " + MAX_SIZE + "."
            );
        }

        return PageRequest.of(page, size);
    }
}