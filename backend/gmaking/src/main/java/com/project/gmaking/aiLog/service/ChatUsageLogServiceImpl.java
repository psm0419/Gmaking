package com.project.gmaking.aiLog.service;

import com.project.gmaking.aiLog.dao.AiUsageLogDAO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ChatUsageLogServiceImpl implements ChatUsageLogSevice {

    private final AiUsageLogDAO aiUsageLogDAO;

    @Override
    public int upsertChatUsage(String userId,
                               String featureType,
                               String modelName,
                               String usageStatus,
                               String errorMessage,
                               String actor) {
        return aiUsageLogDAO.upsertGeminiUsage(
                userId,
                featureType,
                modelName,
                usageStatus,
                errorMessage,
                actor
        );
    }
}
