package com.project.gmaking.debate.ai;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import java.util.*;

@Component
@RequiredArgsConstructor
public class OpenAiClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${openai.api.key}")
    private String apiKey;

    @Value("${openai.chat.model:gpt-4o-mini}")
    private String chatModel;

    public String chat(String systemPrompt, String userPrompt) {
        String url = "https://api.openai.com/v1/chat/completions";

        Map<String,Object> body = new HashMap<>();
        body.put("model", chatModel);
        body.put("temperature", 0.8);

        List<Map<String,String>> messages = List.of(
                Map.of("role","system","content", systemPrompt),
                Map.of("role","user","content", userPrompt)
        );
        body.put("messages", messages);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        ResponseEntity<Map> res = restTemplate.exchange(
                url, HttpMethod.POST, new HttpEntity<>(body, headers), Map.class);

        List choices = (List) res.getBody().get("choices");
        Map first = (Map) choices.get(0);
        Map msg = (Map) first.get("message");
        return (String) msg.get("content");
    }
}
