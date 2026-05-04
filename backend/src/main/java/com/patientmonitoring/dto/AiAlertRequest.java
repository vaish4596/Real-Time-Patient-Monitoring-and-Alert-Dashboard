package com.patientmonitoring.dto;

import lombok.Data;

@Data
public class AiAlertRequest {
    private Long patientId;
    private String vitalType;
    private String severity;
    private String message;
}
