
package com.project.gmaking.rag;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import static com.project.gmaking.rag.GuideDtos.*;

@RestController
@RequestMapping("/api/guide")
public class GuideController {

    private final GuideService service;

    public GuideController(GuideService service) { this.service = service; }

    @PostMapping("/ask")
    public ResponseEntity<AskResponse> ask(@RequestBody AskRequest req) {
        AskResponse resp = service.ask(req.getQuestion());
        return ResponseEntity.ok(resp);
    }
}
