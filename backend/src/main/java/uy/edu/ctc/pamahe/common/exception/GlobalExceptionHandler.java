package uy.edu.ctc.pamahe.common.exception;

import java.nio.file.AccessDeniedException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import javax.naming.AuthenticationException;

import org.slf4j.Logger;

import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import uy.edu.ctc.pamahe.common.response.ApiErrorResponse;

/** 
 * Unifica los errores de la API para que el frontend reciba códigos estables y mensajes seguros.
 * Cada incidente obtiene un identificador que permite relacionar la respuesta con el registro técnico
 * sin devolver detalles internos ni trazas al cliente.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

        private static final Logger LOGGER = LoggerFactory.getLogger(GlobalExceptionHandler.class);

        @ExceptionHandler(ResourceNotFoundException.class)
        public ResponseEntity<ApiErrorResponse> handleNotFound(ResourceNotFoundException exception,
                        HttpServletRequest request) {
                return this.response(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", exception.getMessage(), request, null,
                                exception, false);
        }

        @ExceptionHandler(BusinessException.class)
        public ResponseEntity<ApiErrorResponse> handleBusiness(BusinessException exception,
                        HttpServletRequest request) {
                return this.response(HttpStatus.BAD_REQUEST, "BUSINESS_RULE", exception.getMessage(), request, null,
                                exception,
                                false);
        }

        @ExceptionHandler(AuthenticationException.class)
        public ResponseEntity<ApiErrorResponse> handleAuthentication(AuthenticationException exception,
                        HttpServletRequest request) {
                return this.response(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS",
                                "Usuario o contraseña incorrectos.",
                                request, null, exception, false);
        }

        @ExceptionHandler(AccessDeniedException.class)
        public ResponseEntity<ApiErrorResponse> handleAccessDenied(AccessDeniedException exception,
                        HttpServletRequest request) {
                return this.response(HttpStatus.FORBIDDEN, "ACCESS_DENIED",
                                "No tienes permisos para realizar esta operación.",
                                request, null, exception, false);
        }

        @ExceptionHandler(ExpiredJwtException.class)
        public ResponseEntity<ApiErrorResponse> handleExpiredJwt(ExpiredJwtException exception,
                        HttpServletRequest request) {
                return this.response(HttpStatus.UNAUTHORIZED, "AUTH_TOKEN_EXPIRED", "El token de acceso está vencido.",
                                request,
                                null, exception, false);
        }

        @ExceptionHandler(JwtException.class)
        public ResponseEntity<ApiErrorResponse> handleJwt(JwtException exception,
                        HttpServletRequest request) {
                return this.response(HttpStatus.UNAUTHORIZED, "AUTH_TOKEN_INVALID", "El token de acceso es inválido.",
                                request,
                                null, exception, false);
        }

        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException exception,
                        HttpServletRequest request) {
                Map<String, String> errores = new LinkedHashMap<>();
                exception.getBindingResult().getFieldErrors()
                                .forEach(error -> errores.put(error.getField(), error.getDefaultMessage()));
                return this.response(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
                                "Hay campos inválidos en la solicitud.",
                                request, errores, exception, false);
        }

        @ExceptionHandler(ConstraintViolationException.class)
        public ResponseEntity<ApiErrorResponse> handleConstraintViolation(ConstraintViolationException exception,
                        HttpServletRequest request) {
                Map<String, String> errores = new LinkedHashMap<>();
                exception.getConstraintViolations()
                                .forEach(violation -> errores.put(violation.getPropertyPath().toString(),
                                                violation.getMessage()));
                return this.response(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
                                "Hay parámetros inválidos en la solicitud.",
                                request, errores, exception, false);
        }

        @ExceptionHandler(HttpMessageNotReadableException.class)
        public ResponseEntity<ApiErrorResponse> handleUnreadable(HttpMessageNotReadableException exception,
                        HttpServletRequest request) {
                return this.response(HttpStatus.BAD_REQUEST, "MALFORMED_REQUEST",
                                "El JSON enviado está malformado o contiene un valor no permitido.", request, null,
                                exception, false);
        }

        @ExceptionHandler(MethodArgumentTypeMismatchException.class)
        public ResponseEntity<ApiErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException exception,
                        HttpServletRequest request) {
                String mensaje = "El parámetro '" + exception.getName() + "' contiene un valor incompatible.";
                return this.response(HttpStatus.BAD_REQUEST, "INVALID_PARAMETER", mensaje, request, null, exception,
                                false);
        }

        @ExceptionHandler(MissingServletRequestParameterException.class)
        public ResponseEntity<ApiErrorResponse> handleMissingParameter(
                        MissingServletRequestParameterException exception,
                        HttpServletRequest request) {
                String mensaje = "Falta el parámetro obligatorio '" + exception.getParameterName() + "'.";
                return this.response(HttpStatus.BAD_REQUEST, "MISSING_PARAMETER", mensaje, request, null, exception,
                                false);
        }

        @ExceptionHandler(DataIntegrityViolationException.class)
        public ResponseEntity<ApiErrorResponse> handleDataIntegrity(DataIntegrityViolationException exception,
                        HttpServletRequest request) {
                return this.response(HttpStatus.CONFLICT, "DATA_CONFLICT",
                                "La operación entra en conflicto con datos existentes o restricciones de integridad.",
                                request, null,
                                exception, true);
        }

        @ExceptionHandler(MaxUploadSizeExceededException.class)
        public ResponseEntity<ApiErrorResponse> handleUploadSize(MaxUploadSizeExceededException exception,
                        HttpServletRequest request) {
                return this.response(HttpStatus.CONTENT_TOO_LARGE, "FILE_TOO_LARGE",
                                "El archivo supera el tamaño máximo permitido.", request, null, exception, false);
        }

        @ExceptionHandler(Exception.class)
        public ResponseEntity<ApiErrorResponse> handleGeneral(Exception exception,
                        HttpServletRequest request) {
                return this.response(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR",
                                "Ocurrió un error interno en el servidor.", request, null, exception, true);
        }

        private ResponseEntity<ApiErrorResponse> response(HttpStatus status,
                        String codigo,
                        String mensaje,
                        HttpServletRequest request,
                        Object detalles,
                        Throwable exception,
                        boolean includeStackTrace) {
                // El mismo identificador aparece en la respuesta y en el log para facilitar el diagnóstico. 
                String incidenteId = UUID.randomUUID().toString();
                if (includeStackTrace) {
                        LOGGER.error("Incidente {} - {} {} - {}", incidenteId, request.getMethod(),
                                        request.getRequestURI(), mensaje, exception);
                } else {
                        LOGGER.warn("Incidente {} - {} {} - {} ({})", incidenteId, request.getMethod(),
                                        request.getRequestURI(), mensaje, exception.getClass().getSimpleName());
                }

                return ResponseEntity.status(status)
                                .body(ApiErrorResponse.of(codigo, mensaje, request.getRequestURI(), incidenteId,
                                                detalles));
        }

}
