package uy.edu.ctc.pamahe.common.response;

public record ApiResponse<T>(
        boolean ok,
        String mensaje,
        T data
) {
    public static <T> ApiResponse<T> ok(String mensaje, T data) {
        return new ApiResponse<>(true, mensaje, data);
    }

    public static <T> ApiResponse<T> error(String mensaje, T data) {
        return new ApiResponse<>(false, mensaje, data);
    }
}