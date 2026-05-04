package com.patientmonitoring.service;

import com.patientmonitoring.model.Patient;
import com.patientmonitoring.model.Severity;
import com.patientmonitoring.model.Vital;
import com.patientmonitoring.repository.PatientRepository;
import com.patientmonitoring.repository.VitalRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import java.util.List;
import java.util.Random;

@Service
public class DataSimulationService {

    private final PatientRepository patientRepository;
    private final VitalRepository vitalRepository;
    private final AlertService alertService;
    private final SimpMessagingTemplate messagingTemplate;
    private final Random random = new Random();
    private final RestTemplate restTemplate = new RestTemplate();
    private final String AI_SERVICE_URL = "http://ai_service:8000/analyze";

    public DataSimulationService(PatientRepository patientRepository,
                                 VitalRepository vitalRepository,
                                 AlertService alertService,
                                 SimpMessagingTemplate messagingTemplate) {
        this.patientRepository = patientRepository;
        this.vitalRepository = vitalRepository;
        this.alertService = alertService;
        this.messagingTemplate = messagingTemplate;
    }

    // Runs every 2 seconds
    @Scheduled(fixedRate = 2000)
    public void generateAndBroadcastVitals() {
        List<Patient> patients = patientRepository.findAll();

        for (Patient patient : patients) {
            Vital vital = generateRandomVital(patient);
            
            // Save to database
            vital = vitalRepository.save(vital);

            // Broadcast to WebSocket topic specific to the patient
            messagingTemplate.convertAndSend("/topic/vitals/" + patient.getId(), vital);
            
            // Broadcast to a general topic for the doctor dashboard
            messagingTemplate.convertAndSend("/topic/vitals/all", vital);
            
            // Send vital to Python AI service for anomaly detection
            try {
                java.util.Map<String, Object> request = new java.util.HashMap<>();
                request.put("patientId", patient.getId());
                request.put("heartRate", vital.getHeartRate());
                request.put("bloodPressureSystolic", vital.getBloodPressureSystolic());
                request.put("bloodPressureDiastolic", vital.getBloodPressureDiastolic());
                request.put("oxygenLevel", vital.getOxygenLevel());
                request.put("temperature", vital.getTemperature());

                @SuppressWarnings("rawtypes")
                ResponseEntity<java.util.Map> response = restTemplate.postForEntity(AI_SERVICE_URL, request, java.util.Map.class);
                @SuppressWarnings("unchecked")
                java.util.Map<String, Object> body = (java.util.Map<String, Object>) response.getBody();
                
                if (body != null && Boolean.TRUE.equals(body.get("isAnomaly"))) {
                    String vitalType = String.valueOf(body.getOrDefault("vitalType", "Unknown"));
                    String message = String.valueOf(body.getOrDefault("message", "Anomaly detected"));
                    Severity severity = parseSeverity(body.get("severity"));

                    alertService.tryCreateAiAlert(patient.getId(), vitalType, severity, message).ifPresent(alert ->
                            System.out.println("ANOMALY DETECTED by AI Service for Patient " + patient.getId() + ": " + message)
                    );
                }
            } catch (Exception e) {
                System.err.println("Error calling AI service: " + e.getMessage());
            }
        }
    }

    private Vital generateRandomVital(Patient patient) {
        Vital vital = new Vital();
        vital.setPatient(patient);
        
        // Base normal values with some random noise
        vital.setHeartRate(70 + random.nextInt(30)); // 70 to 100
        vital.setBloodPressureSystolic(110 + random.nextInt(20)); // 110 to 130
        vital.setBloodPressureDiastolic(70 + random.nextInt(15)); // 70 to 85
        vital.setOxygenLevel(95 + random.nextInt(5)); // 95 to 100
        
        double temp = 36.5 + (random.nextDouble() * 1.5); // 36.5 to 38.0
        vital.setTemperature(new BigDecimal(temp).setScale(2, RoundingMode.HALF_UP));

        // Occasionally inject anomalies for testing (5% chance)
        if (random.nextInt(100) < 5) {
            int anomalyType = random.nextInt(4);
            switch (anomalyType) {
                case 0: vital.setHeartRate(120 + random.nextInt(30)); break; // Tachycardia
                case 1: vital.setBloodPressureSystolic(160 + random.nextInt(30)); break; // Hypertension
                case 2: vital.setOxygenLevel(85 + random.nextInt(5)); break; // Hypoxia
                case 3: vital.setTemperature(new BigDecimal(39.0 + random.nextDouble() * 2).setScale(2, RoundingMode.HALF_UP)); break; // Fever
            }
        }

        return vital;
    }

    private Severity parseSeverity(Object severityValue) {
        if (severityValue == null) {
            return Severity.MEDIUM;
        }

        try {
            return Severity.valueOf(severityValue.toString().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return Severity.MEDIUM;
        }
    }
}
