package com.project.gmaking.login.service;

import com.project.gmaking.login.vo.LoginRequestVO;
import com.project.gmaking.login.vo.LoginVO;
import com.project.gmaking.login.vo.RegisterRequestVO;

public interface LoginService {

    /**
     * 로그인 요청을 처리하고 인증에 성공한 사용자 정보를 반환
     */
    LoginVO authenticate(LoginRequestVO requestVO);

    /**
     * 회원가입 요청을 처리하고 사용자 정보를 DB에 저장
     * @param requestVO 회원가입 요청 정보
     * @return 등록된 사용자 정보
     * @throws IllegalArgumentException 중복 등의 오류 발생 시
     */
    LoginVO register(RegisterRequestVO requestVO);

    /**
     * ID, 닉네임, 이메일 중복 여부 확인
     * @param type 확인할 필드 타입 (userId, userNickname, userEmail)
     * @param value 확인할 값
     * @return 중복이면 true, 아니면 false
     */
    boolean isDuplicate(String type, String value);

    /**
     * 이메일 인증 완료 후 TB_USER의 인증 상태를 'Y'로 업데이트
     */
    void completeEmailVerification(String userId);

    /**
     * 이름과 이메일로 아이디를 찾고, 인증 코드를 발송
     * @param userName 사용자 이름
     * @param userEmail 사용자 이메일
     * @return 인증 코드 발송을 위해 임시로 사용할 사용자 ID
     * @throws IllegalArgumentException 사용자 정보가 없을 경우
     * @throws Exception 이메일 발송 오류
     */
    String findIdAndSendVerification(String userName, String userEmail) throws Exception;

    /**
     * 아이디 찾기 인증 코드를 검증하고, 마스킹된 아이디를 반환
     * @param userId 인증 코드가 발송된 임시 ID
     * @return 마스킹된 아이디 (예: 'us***id')
     * @throws IllegalArgumentException 인증 실패 시
     */
    String verifyCodeAndGetUserId(String userId);

    /**
     * 비밀번호 찾기 요청: ID와 이메일로 사용자 검증 후 인증 코드 발송
     * @param userId 사용자 ID
     * @param userEmail 사용자 이메일
     * @throws IllegalArgumentException 사용자 정보가 없을 경우
     * @throws Exception 이메일 발송 오류
     */
    void findPasswordAndSendVerification(String userId, String userEmail) throws Exception;

    /**
     * 비밀번호 변경 처리: 인증이 완료된 사용자만 새 비밀번호로 업데이트
     * @param userId 비밀번호를 변경할 사용자 ID
     * @param userEmail 사용자 이메일 (인증 레코드 조회를 위해 필요)
     * @param newRawPassword 새 비밀번호 (암호화 필요)
     * @throws IllegalArgumentException 인증 실패 또는 비밀번호 규칙 미준수 시
     */
    void changePassword(String userId, String userEmail, String newRawPassword);

    /**
     * 회원 탈퇴 처리: 비밀번호를 검증하고 사용자 및 관련 정보를 삭제
     * @param userId 탈퇴할 사용자 ID
     * @param rawPassword 사용자가 입력한 비밀번호
     * @throws IllegalArgumentException 비밀번호 불일치 또는 사용자 없음
     */
    void withdrawUser(String userId, String rawPassword);

    /**
     * 소셜 회원 탈퇴 처리: 비밀번호 검증 없이 사용자 및 관련 정보를 삭제 (추가)
     * @param userId 탈퇴할 사용자 ID (JWT에서 추출된 ID)
     * @throws IllegalArgumentException 사용자 없음
     */
    void withdrawSocialUser(String userId);

}