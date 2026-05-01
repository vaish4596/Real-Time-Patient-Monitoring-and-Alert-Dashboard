package com.patientmonitoring.service;

import com.patientmonitoring.model.Patient;
import com.patientmonitoring.model.Vital;
import com.patientmonitoring.repository.PatientRepository;
import com.patientmonitoring.repository.VitalRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Random;

@Service
public class DataSimulationService {

    private final PatientRepository patientRepository;
    private final VitalRepository vitalRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final Random random = new Random();

    public DataSimulationService(PatientRepository patientRepository, 
                                 VitalRepository vitalRepository, 
                                 SimpMessagingTemplate messagingTemplate) {
        this.patientRepository = patientRepository;
        this.vitalRepository = vitalRepository;
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
            
            // TODO: In Phase 2, we will send this vital to the Python AI service for anomaly detection via a REST call
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
}
