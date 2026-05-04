CREATE DATABASE IF NOT EXISTS patient_db;
USE patient_db;

CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('DOCTOR', 'PATIENT', 'ADMIN') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE patients (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    age INT,
    gender VARCHAR(10),
    medical_history TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE vitals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    heart_rate INT,
    blood_pressure_systolic INT,
    blood_pressure_diastolic INT,
    oxygen_level INT,
    temperature DECIMAL(4, 2),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

CREATE TABLE alerts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    vital_type VARCHAR(50) NOT NULL,
    alert_message VARCHAR(255) NOT NULL,
    severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

CREATE TABLE logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    action VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Seed: default users (password: admin123)
INSERT INTO users (username, password_hash, role) VALUES
  ('doctor1', '$2a$10$fBgw6P.gEcxAFj1pH5437.92kfd5pNFL.0DZOnw6wWvmkt74cA41y', 'DOCTOR');

-- Seed: test patients linked to the doctor user
INSERT INTO users (username, password_hash, role) VALUES
  ('patient1', '$2a$10$fBgw6P.gEcxAFj1pH5437.92kfd5pNFL.0DZOnw6wWvmkt74cA41y', 'PATIENT'),
  ('patient2', '$2a$10$fBgw6P.gEcxAFj1pH5437.92kfd5pNFL.0DZOnw6wWvmkt74cA41y', 'PATIENT'),
  ('patient3', '$2a$10$fBgw6P.gEcxAFj1pH5437.92kfd5pNFL.0DZOnw6wWvmkt74cA41y', 'PATIENT');

INSERT INTO patients (user_id, first_name, last_name, age, gender, medical_history) VALUES
  (2, 'Alice',   'Johnson', 45, 'Female', 'Hypertension'),
  (3, 'Bob',     'Smith',   62, 'Male',   'Diabetes Type 2'),
  (4, 'Carol',   'Williams',38, 'Female', 'Asthma');

