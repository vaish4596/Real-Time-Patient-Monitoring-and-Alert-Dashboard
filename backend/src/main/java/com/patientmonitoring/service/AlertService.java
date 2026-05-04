package com.patientmonitoring.service;

import com.patientmonitoring.model.Alert;
import com.patientmonitoring.model.Patient;
import com.patientmonitoring.model.Severity;
import com.patientmonitoring.repository.AlertRepository;
import com.patientmonitoring.repository.PatientRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class AlertService {

    private static final int DEDUPE_SECONDS = 12;

    private final AlertRepository alertRepository;
    private final PatientRepository patientRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public AlertService(AlertRepository alertRepository,
                        PatientRepository patientRepository,
                        SimpMessagingTemplate messagingTemplate) {
        this.alertRepository = alertRepository;
        this.patientRepository = patientRepository;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Creates an AI-derived alert and broadcasts it unless a similar alert was just raised
     * for the same patient, vital type, and severity (avoids duplicate rows when backend and
     * frontend both analyze the same reading).
     */
    @Transactional
    public Optional<Alert> tryCreateAiAlert(Long patientId, String vitalType, Severity severity, String message) {
        if (patientId == null || vitalType == null || message == null || message.isBlank()) {
            return Optional.empty();
        }

        Patient patient = patientRepository.findById(patientId).orElse(null);
        if (patient == null) {
            return Optional.empty();
        }

        LocalDateTime since = LocalDateTime.now().minusSeconds(DEDUPE_SECONDS);
        if (alertRepository.existsByPatient_IdAndVitalTypeAndSeverityAndCreatedAtAfter(
                patientId, vitalType, severity, since)) {
            return Optional.empty();
        }

        Alert alert = new Alert();
        alert.setPatient(patient);
        alert.setVitalType(vitalType);
        alert.setAlertMessage(message);
        alert.setSeverity(severity);
        alert.setIsResolved(false);

        alert = alertRepository.save(alert);
        messagingTemplate.convertAndSend("/topic/alerts/all", alert);
        return Optional.of(alert);
    }
}
