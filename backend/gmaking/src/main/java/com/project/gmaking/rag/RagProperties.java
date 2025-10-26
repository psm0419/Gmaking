package com.project.gmaking.rag;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.rag")
public class RagProperties {
    /** 자동 인덱싱 여부 */
    private boolean autoIngest = false;
    /** 가이드 디렉터리 */
    private String guidesDir;
    /** 검색 topK */
    private int topK = 4;

    public boolean isAutoIngest() { return autoIngest; }
    public void setAutoIngest(boolean autoIngest) { this.autoIngest = autoIngest; }

    public String getGuidesDir() { return guidesDir; }
    public void setGuidesDir(String guidesDir) { this.guidesDir = guidesDir; }

    public int getTopK() { return topK; }
    public void setTopK(int topK) { this.topK = topK; }
}
