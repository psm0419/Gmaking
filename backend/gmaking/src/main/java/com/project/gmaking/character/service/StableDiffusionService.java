package com.project.gmaking.character.service;

import com.project.gmaking.character.vo.StableDiffusionRequestVO;
import reactor.core.publisher.Mono;
import java.util.List;

public interface StableDiffusionService {
    Mono<List<String>> generateImage(StableDiffusionRequestVO requestVO);
}