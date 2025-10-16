package com.project.gmaking.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload.profile-dir:D:/Gmaking}")
    private String baseDir;

    @Value("${app.upload.public-url-prefix:/images}")
    private String urlPrefix;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // URL prefix 정규화: "/images/**"
        String pattern = (urlPrefix.startsWith("/") ? urlPrefix : "/" + urlPrefix).replaceAll("/+$", "") + "/**";

        // file: 로케이션은 디렉터리 끝에 슬래시 필요
        String location = Paths.get(baseDir).toUri().toString();
        if (!location.endsWith("/")) location += "/";   // 중요!

        registry.addResourceHandler(pattern)
                .addResourceLocations(location);
    }


}
