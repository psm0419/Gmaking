//package com.project.gmaking.imageUpload;
//
//
//public enum ImageKind {
//    PROFILE(0, "profile"),
//    CHARACTER(1, "character"),
//    MONSTER(2, "monster");
//
//    public final int code;
//    public final String subDir;
//
//    ImageKind(int code, String subDir) {
//        this.code = code;
//        this.subDir = subDir;
//    }
//
//    public static ImageKind fromCode(int code) {
//        for (var k : values()) if (k.code == code) return k;
//        throw new IllegalArgumentException("Unsupported imageType: " + code);
//    }
//
//}
