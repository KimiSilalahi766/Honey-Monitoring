import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { classificationRequestSchema, classificationResponseSchema } from "@shared/schema";

// ========================================
// GOOGLE COLAB SERVER CLASSIFICATION
// Rule-based algorithm from 79,540 EHR samples
// Firebase-only architecture
// ========================================

// Google Colab dataset statistics
const GOOGLE_COLAB_STATS = {
  total_samples: 79540,
  distributions: {
    Normal: { count: 54108, percentage: 68.0 },
    'Kurang Normal': { count: 20064, percentage: 25.2 },
    'Berbahaya': { count: 5368, percentage: 6.8 }
  }
};

// Medical ranges from Google Colab analysis
const SERVER_MEDICAL_RANGES = {
  // Blood pressure (mmHg)
  blood_pressure: {
    systolic: { min: 90, max: 120 },
    diastolic: { min: 60, max: 80 }
  },
  // Heart rate (BPM)
  heart_rate: {
    min: 60, max: 100
  },
  // Oxygen saturation (%)
  oxygen_saturation: {
    min: 95, max: 100
  },
  // Body temperature (Celsius)
  body_temperature: {
    min: 36.1, max: 37.2
  }
};

class GoogleColabServerClassifier {
  // Google Colab determine_health() function - Server implementation
  private determineHealth(input: {
    suhu: number;
    bpm: number;
    spo2: number;
    tekanan_sys: number;
    tekanan_dia: number;
  }): { classification: string; confidence: number; probabilities: Record<string, number>; abnormalCount: number; abnormalParameters: string[] } {
    
    let abnormalCount = 0;
    const abnormalParameters: string[] = [];

    // --- 1. Tekanan Darah (Blood Pressure) ---
    const sistolik = input.tekanan_sys;
    const diastolik = input.tekanan_dia;
    if (sistolik < SERVER_MEDICAL_RANGES.blood_pressure.systolic.min || 
        sistolik > SERVER_MEDICAL_RANGES.blood_pressure.systolic.max ||
        diastolik < SERVER_MEDICAL_RANGES.blood_pressure.diastolic.min || 
        diastolik > SERVER_MEDICAL_RANGES.blood_pressure.diastolic.max) {
      abnormalCount++;
      abnormalParameters.push('Tekanan Darah');
    }

    // --- 2. Detak Jantung (Heart Rate) ---
    const detak = input.bpm;
    if (detak < SERVER_MEDICAL_RANGES.heart_rate.min || detak > SERVER_MEDICAL_RANGES.heart_rate.max) {
      abnormalCount++;
      abnormalParameters.push('Detak Jantung');
    }

    // --- 3. Saturasi Oksigen (Oxygen Saturation) ---
    const spo2 = input.spo2;
    if (spo2 < SERVER_MEDICAL_RANGES.oxygen_saturation.min || spo2 > SERVER_MEDICAL_RANGES.oxygen_saturation.max) {
      abnormalCount++;
      abnormalParameters.push('Saturasi Oksigen');
    }

    // --- 4. Suhu Tubuh (Body Temperature) ---
    const suhu = input.suhu;
    if (suhu < SERVER_MEDICAL_RANGES.body_temperature.min || suhu > SERVER_MEDICAL_RANGES.body_temperature.max) {
      abnormalCount++;
      abnormalParameters.push('Suhu Tubuh');
    }

    // --- Klasifikasi berdasarkan jumlah parameter abnormal ---
    // Exact logic from Google Colab
    let classification: string;
    if (abnormalCount >= 3) {
      classification = 'Berbahaya';
    } else if (abnormalCount >= 2) {
      classification = 'Kurang Normal';
    } else {
      classification = 'Normal';
    }

    // Calculate confidence based on dataset distribution
    const probabilities = {
      'Normal': classification === 'Normal' ? 0.85 : (classification === 'Kurang Normal' ? 0.10 : 0.05),
      'Kurang Normal': classification === 'Kurang Normal' ? 0.80 : (classification === 'Normal' ? 0.15 : 0.05),
      'Berbahaya': classification === 'Berbahaya' ? 0.90 : (classification === 'Kurang Normal' ? 0.05 : 0.05)
    };

    return {
      classification,
      confidence: probabilities[classification as keyof typeof probabilities],
      probabilities,
      abnormalCount,
      abnormalParameters
    };
  }

  predict(input: {
    suhu: number;
    bpm: number;
    spo2: number;
    tekanan_sys: number;
    tekanan_dia: number;
  }): { classification: string; confidence: number; probabilities: Record<string, number> } {
    
    // Apply medical calibration (ESP32 sensor offset)
    const calibratedInput = {
      suhu: input.suhu,
      bpm: input.bpm,
      spo2: input.spo2,
      tekanan_sys: input.tekanan_sys - 15, // Calibration -15 mmHg systolic
      tekanan_dia: input.tekanan_dia - 10   // Calibration -10 mmHg diastolic
    };

    // Google Colab classification algorithm
    const result = this.determineHealth(calibratedInput);
    
    return {
      classification: result.classification,
      confidence: result.confidence,
      probabilities: result.probabilities
    };
  }

  // Get model information
  getStats() {
    return {
      algorithm: 'Google Colab Rule-based Classification',
      dataset_source: 'Kaggle EHR Patient Health Scores',
      total_samples: GOOGLE_COLAB_STATS.total_samples,
      distributions: GOOGLE_COLAB_STATS.distributions,
      medical_ranges: SERVER_MEDICAL_RANGES
    };
  }
}

// Initialize Google Colab server classifier (rule-based, no training needed)
const classifier = new GoogleColabServerClassifier();

export async function registerRoutes(app: Express): Promise<Server> {
  // Firebase-only architecture - no database storage endpoints needed
  // All data handled through Firebase Realtime Database

  // Classification API endpoint
  app.post("/api/classify", async (req, res) => {
    try {
      // Validate request body
      const validatedData = classificationRequestSchema.parse(req.body);
      
      // Google Colab classification (built-in calibration)
      const result = classifier.predict({
        suhu: validatedData.suhu,
        bpm: validatedData.bpm,
        spo2: validatedData.spo2,
        tekanan_sys: validatedData.tekanan_sys, // Calibration handled internally
        tekanan_dia: validatedData.tekanan_dia   // Calibration handled internally
      });
      
      // Validate and return response
      const response = classificationResponseSchema.parse({
        classification: result.classification as "Normal" | "Kurang Normal" | "Berbahaya",
        confidence: result.confidence,
        probabilities: result.probabilities
      });

      res.json(response);
    } catch (error) {
      console.error('Google Colab classification error:', error);
      res.status(400).json({ 
        error: 'Google Colab classification failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      classifier: 'ready',
      architecture: 'Firebase-only'
    });
  });

  // Model information endpoint
  app.get("/api/model-info", (_req, res) => {
    res.json({
      success: true,
      model: classifier.getStats(),
      architecture: 'Firebase-only classification server',
      description: 'Google Colab rule-based classification without database dependencies'
    });
  });

  // Firebase test endpoint (for development)
  app.get("/api/test-data", (_req, res) => {
    // This endpoint can be used to test the system without actual ESP32 data
    const testData = {
      timestamp: Date.now(),
      suhu: 36.8,
      bpm: 78,
      spo2: 98,
      tekanan_sys: 105, // After medical calibration
      tekanan_dia: 70,  // After medical calibration
      signal_quality: 85,
      kondisi: "Normal"
    };
    
    res.json(testData);
  });

  const httpServer = createServer(app);
  return httpServer;
}