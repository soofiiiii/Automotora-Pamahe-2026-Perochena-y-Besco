package uy.edu.ctc.pamahe.common.exception;

/** Indica reutilización de una clave idempotente con un payload distinto. */
public class IdempotencyConflictException extends RuntimeException {
    public IdempotencyConflictException(String message) {
        super(message);
    }
}
