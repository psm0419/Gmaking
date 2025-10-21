package com.project.gmaking.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

import javax.sql.DataSource;

@Configuration
public class MyBatisConfig {

    @Bean
    public JsonLongListTypeHandler jsonLongListTypeHandler(ObjectMapper objectMapper){
        return new JsonLongListTypeHandler(objectMapper);
    }

    @Bean
    public SqlSessionFactory sqlSessionFactory(
            DataSource dataSource,
            JsonLongListTypeHandler jsonLongListTypeHandler
    ) throws Exception{
        SqlSessionFactoryBean sessionFactory = new SqlSessionFactoryBean();
        sessionFactory.setDataSource(dataSource);

        sessionFactory.setMapperLocations(
                new PathMatchingResourcePatternResolver().getResources("classpath:/mapper/**/*.xml")
        );
        sessionFactory.setTypeHandlers(new JsonLongListTypeHandler[]{
                jsonLongListTypeHandler
        });

        org.apache.ibatis.session.Configuration mybatisConfig = new org.apache.ibatis.session.Configuration();
        mybatisConfig.setMapUnderscoreToCamelCase(true);
        sessionFactory.setConfiguration(mybatisConfig);

        return sessionFactory.getObject();
    }
}