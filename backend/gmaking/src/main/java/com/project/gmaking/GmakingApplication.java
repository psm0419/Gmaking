package com.project.gmaking;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@MapperScan(basePackages = {
        "com.project.gmaking.login.dao",        // Login DAO
        "com.project.gmaking.email.dao",        // Email DAO
        "com.project.gmaking.pve.dao",          // Pve DAO
        "com.project.gmaking.character.dao"     // character DAO
})
@SpringBootApplication
public class GmakingApplication {

	public static void main(String[] args) {
        SpringApplication.run(GmakingApplication.class, args);
	}

}
