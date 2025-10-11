package com.project.gmaking.aiLog.service;

public interface ChatUsageLogSevice {
    int upsertChatUsage(String userId,
                        String featureType,   // "chat"
                        String modelName,     // "gemini-1.5-flash"
                        String usageStatus,   // success | quota_exceeded | error
                        String errorMessage,
                        String actor);  // created_by/updated_by
}
