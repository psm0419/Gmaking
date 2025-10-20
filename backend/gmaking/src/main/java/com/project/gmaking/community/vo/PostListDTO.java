package com.project.gmaking.community.vo;

import com.project.gmaking.community.vo.PostVO;
import com.project.gmaking.community.vo.PostPagingVO;
import lombok.Data;
import lombok.AllArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
public class PostListDTO {
    private List<PostVO> list;
    private PostPagingVO pagingInfo;
}
