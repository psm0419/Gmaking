// DebateService.java
package com.project.gmaking.debate.service;

import com.project.gmaking.debate.vo.DebateRequestVO;
import com.project.gmaking.debate.vo.DebateResultVO;

public interface DebateService {
    DebateResultVO run(DebateRequestVO req);
}
