
package com.project.gmaking.common;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(IllegalArgumentException.class)
    public Map<String, Object> handleIllegalArgument(IllegalArgumentException ex) {
        return Map.of(
                "message", ex.getMessage()
        );
    }

    // 필요하면 추가 커버:
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(org.springframework.web.server.ResponseStatusException.class)
    public Map<String, Object> handleRSE(org.springframework.web.server.ResponseStatusException ex) {
        return Map.of(
                "message", ex.getReason()
        );
    }
}
