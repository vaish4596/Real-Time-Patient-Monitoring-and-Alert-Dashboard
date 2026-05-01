package com.patientmonitoring.controller;

import com.patientmonitoring.model.Alert;
import com.patientmonitoring.repository.AlertRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    private final AlertRepository alertRepository;

    public AlertController(AlertRepository alertRepository) {
        this.alertRepository = alertRepository;
    }

    @GetMapping("/active")
    public ResponseEntity<List<Alert>> getActiveAlerts() {
        return ResponseEntity.ok(alertRepository.findByIsResolvedFalseOrderByCreatedAtDesc());
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
            alertRepository.save(alert);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
