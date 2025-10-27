
package com.project.gmaking.common;

import com.project.gmaking.character.exception.ClassificationFailedException;
import org.apache.catalina.connector.ClientAbortException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
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

    // ----------------------------------------------------------------------

    /**
     * ClassificationFailedException 발생 시 처리
     * - 이미지 분류 실패와 관련된 비즈니스 오류 (정확도 낮음, 허용 목록 외 동물)
     * - HTTP Status: 400 Bad Request 반환
     */
    @ExceptionHandler(ClassificationFailedException.class)
    public ResponseEntity<Map<String, Object>> handleClassificationFailedException(ClassificationFailedException e) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("message", e.getMessage());
        errorResponse.put("error", "Classification Validation Failed");
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .contentType(MediaType.APPLICATION_JSON)
                .body(errorResponse);
    }

    @ExceptionHandler(ClientAbortException.class)
    public void handleClientAbort(ClientAbortException e) {}

}
