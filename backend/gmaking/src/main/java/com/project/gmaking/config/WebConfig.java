package com.project.gmaking.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload.profile-dir:C:/Gmaking}")
    private String baseDir;

    @Value("${app.upload.public-url-prefix:/images}")
    private String urlPrefix;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 로컬 디스크 경로를 정적 URL로 공개
        String location = Paths.get(baseDir).toUri().toString(); // file:///C:/upload/profile/
        registry.addResourceHandler(urlPrefix + "/**")
                .addResourceLocations(location);
    }

}
