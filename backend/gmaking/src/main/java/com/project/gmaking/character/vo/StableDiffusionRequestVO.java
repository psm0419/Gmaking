package com.project.gmaking.character.vo;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StableDiffusionRequestVO {

    private String prompt;
    private String negative_prompt;
    private int steps;
    private int width;
    private int height;
    private double cfg_scale;
    private String sampler_index;
    private int batch_size;
    private int n_iter;
    private boolean send_images;
    private boolean save_images;

}