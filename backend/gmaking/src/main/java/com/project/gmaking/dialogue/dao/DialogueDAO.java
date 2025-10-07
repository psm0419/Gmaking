package com.project.gmaking.dialogue.dao;

import com.project.gmaking.dialogue.vo.DialogueVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface DialogueDAO {
    int insert(DialogueVO d);
    List<DialogueVO> findByConversation(@Param("conversationId") int conversationId,
                                        @Param("limit") int limit);
}
