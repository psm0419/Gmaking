// DebateController.java
package com.project.gmaking.debate.controller;

import com.project.gmaking.debate.service.DebateService;
import com.project.gmaking.debate.vo.DebateRequestVO;
import com.project.gmaking.debate.vo.DebateResultVO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/debate")
@RequiredArgsConstructor
public class DebateController {

    private final DebateService debateService;

    @PostMapping("/start")
    public DebateResultVO start(@RequestBody DebateRequestVO req) {
        return debateService.run(req);
    }
}
