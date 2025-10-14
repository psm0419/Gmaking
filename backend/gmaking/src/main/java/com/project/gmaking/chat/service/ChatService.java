package com.project.gmaking.chat.service;

import com.project.gmaking.chat.vo.DialogueVO;

import java.util.List;

public interface ChatService {
    String send(String userId, Integer CharacterId, String message);
    List<DialogueVO> history(String userId, Integer characterId, int limit);

}
