package com.patientmonitoring.controller;

import com.patientmonitoring.dto.AiAlertRequest;
import com.patientmonitoring.model.Alert;
import com.patientmonitoring.model.Severity;
import com.patientmonitoring.repository.AlertRepository;
import com.patientmonitoring.service.AlertService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    private final AlertRepository alertRepository;
    private final AlertService alertService;

    public AlertController(AlertRepository alertRepository, AlertService alertService) {
        this.alertRepository = alertRepository;
        this.alertService = alertService;
    }

    @PostMapping("/ai")
    public ResponseEntity<?> createFromAi(@RequestBody AiAlertRequest req) {
        if (req.getPatientId() == null || req.getMessage() == null || req.getMessage().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "patientId and message are required"));
        }
        if (req.getSeverity() == null || req.getSeverity().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "severity is required"));
        }
        try {
            Severity severity = Severity.valueOf(req.getSeverity().trim().toUpperCase());
            String vitalType = req.getVitalType() != null && !req.getVitalType().isBlank()
                    ? req.getVitalType()
                    : "AI Assessment";
            Optional<Alert> created = alertService.tryCreateAiAlert(
                    req.getPatientId(), vitalType, severity, req.getMessage());
            if (created.isPresent()) {
                return ResponseEntity.ok(created.get());
            }
            return ResponseEntity.accepted().body(Map.of("deduped", true));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid severity value"));
        }
    }

    @GetMapping("/active")
    public ResponseEntity<List<Alert>> getActiveAlerts() {
        return ResponseEntity.ok(alertRepository.findByIsResolvedFalseOrderByCreatedAtDesc());
    }

    @GetMapping("/resolved")
    public ResponseEntity<List<Alert>> getResolvedAlerts() {
        return ResponseEntity.ok(alertRepository.findTop50ByIsResolvedTrueOrderByResolvedAtDesc());
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<Alert>> getAlertsForPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(alertRepository.findByPatientIdOrderByCreatedAtDesc(patientId));
    }

    @PostMapping("/{alertId}/resolve")
    public ResponseEntity<?> resolveAlert(@PathVariable Long alertId) {
        return alertRepository.findById(alertId).map(alert -> {
            alert.setIsResolved(true);
            alert.setResolvedAt(LocalDateTime.now());
            Alert resolvedAlert = alertRepository.save(alert);
            return ResponseEntity.ok(resolvedAlert);
        }).orElse(ResponseEntity.notFound().build());
    }
}
