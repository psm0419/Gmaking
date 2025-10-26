package com.project.gmaking.certification.service;

import com.project.gmaking.certification.dao.CharacterCertificateDao;
import com.project.gmaking.certification.vo.CharacterCertificateVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CertificateService {

    private final CharacterCertificateDao certificateDao;

    public CharacterCertificateVO getCertificate(Integer characterId, String requesterUserId, boolean isAdmin) {
        // 1) 조회
        CharacterCertificateVO vo = certificateDao.findCertificateByCharacterId(characterId);
        if (vo == null) return null;


        return vo;
    }

}
