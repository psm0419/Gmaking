package com.project.gmaking.character.vo;

import lombok.Data;
import lombok.ToString;
import com.fasterxml.jackson.annotation.JsonProperty;

@Data
@ToString
public class ClassificationResponseVO {
    @JsonProperty("predicted_animal")
    private String predictedAnimal;
    private double confidence;
}