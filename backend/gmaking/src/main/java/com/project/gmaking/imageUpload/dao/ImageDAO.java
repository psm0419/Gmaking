package com.project.gmaking.imageUpload.dao;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.Map;

@Mapper
public interface ImageDAO {
    // 이미지 매핑 p
    int insertImage(@Param("p")Map<String, Object> p);
}
