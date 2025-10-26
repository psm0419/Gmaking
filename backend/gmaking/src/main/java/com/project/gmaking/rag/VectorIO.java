package com.project.gmaking.rag;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;

public final class VectorIO {
    private VectorIO() {}

    public static byte[] toBytes(float[] v) {
        ByteBuffer bb = ByteBuffer.allocate(v.length * 4).order(ByteOrder.LITTLE_ENDIAN);
        for (float f : v) bb.putFloat(f);
        return bb.array();
    }

    public static float[] toFloatArray(byte[] bytes) {
        ByteBuffer bb = ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN);
        int n = bytes.length / 4;
        float[] v = new float[n];
        for (int i = 0; i < n; i++) v[i] = bb.getFloat();
        return v;
    }

    public static double cosine(float[] a, float[] b) {
        double dot = 0, na = 0, nb = 0;
        int n = Math.min(a.length, b.length);
        for (int i = 0; i < n; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
        if (na == 0 || nb == 0) return 0;
        return dot / (Math.sqrt(na) * Math.sqrt(nb));
    }
}
