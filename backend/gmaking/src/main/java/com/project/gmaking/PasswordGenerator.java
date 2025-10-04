package com.project.gmaking;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String rawPassword = "1111";

        // 1111에 대한 BCrypt 해시 생성
        String encodedPassword = encoder.encode(rawPassword);

        System.out.println("--- 1111에 대한 BCrypt 해시 ---");
        System.out.println(encodedPassword);
        System.out.println("---------------------------------");
    }
}
