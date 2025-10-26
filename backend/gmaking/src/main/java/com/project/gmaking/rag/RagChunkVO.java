package com.project.gmaking.rag;

public class RagChunkVO {

    private Long id;
    private String docPath;
    private Integer chunkIndex;
    private String text;
    private byte[] vector;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getDocPath() { return docPath; }
    public void setDocPath(String docPath) { this.docPath = docPath; }
    public Integer getChunkIndex() { return chunkIndex; }
    public void setChunkIndex(Integer chunkIndex) { this.chunkIndex = chunkIndex; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public byte[] getVector() { return vector; }
    public void setVector(byte[] vector) { this.vector = vector; }

}
