package com.project.gmaking.certification.controller;

import com.project.gmaking.certification.service.CertificateService;
import com.project.gmaking.certification.vo.CharacterCertificateVO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/characters")
public class CertificateController {
    private final CertificateService certificateService;

    @GetMapping("/{characterId}/certificate")
    public ResponseEntity<?> getCertificate(
            @PathVariable("characterId") Integer characterId
            // @AuthenticationPrincipal CustomUser user  // JWT로부터 userId/role 받고 싶으면 사용
    ) {
        // String userId = user.getUserId();
        // boolean isAdmin = user.hasRole("ADMIN");
        String userId = null;
        boolean isAdmin = false;

        CharacterCertificateVO vo = certificateService.getCertificate(characterId, userId, isAdmin);
        if (vo == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(vo);
    }
}
