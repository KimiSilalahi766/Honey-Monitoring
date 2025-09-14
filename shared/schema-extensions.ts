import { z } from "zod";

// ========================================
// GOOGLE COLAB EXTENDED SCHEMAS
// Additional schemas for Google Colab integration
// ========================================

// Medical Ranges Schema (Google Colab derived)
export const medicalRangesSchema = z.object({
  blood_pressure: z.object({
    systolic: z.object({ min: z.number().default(90), max: z.number().default(120) }),
    diastolic: z.object({ min: z.number().default(60), max: z.number().default(80) })
  }),
  heart_rate: z.object({ min: z.number().default(60), max: z.number().default(100) }),
  oxygen_saturation: z.object({ min: z.number().default(95), max: z.number().default(100) }),
  body_temperature: z.object({ min: z.number().default(36.1), max: z.number().default(37.2) })
});

// Google Colab Dataset Statistics Schema
export const datasetStatsSchema = z.object({
  total_samples: z.number().describe("Total samples from Kaggle dataset"),
  distributions: z.object({
    Normal: z.object({ count: z.number(), percentage: z.number() }),
    "Kurang Normal": z.object({ count: z.number(), percentage: z.number() }),
    Berbahaya: z.object({ count: z.number(), percentage: z.number() })
  }),
  source: z.string().default("Kaggle Patient Health Scores for EHR Data"),
  processed_date: z.string().optional(),
  notebook_url: z.string().url().optional()
});

// Rule-based Classification Result Schema
export const ruleBasedResultSchema = z.object({
  input_parameters: z.object({
    suhu: z.number(),
    bpm: z.number(),
    spo2: z.number(),
    tekanan_sys: z.number(),
    tekanan_dia: z.number()
  }),
  parameter_analysis: z.array(z.object({
    parameter: z.string(),
    value: z.number(),
    status: z.enum(["Normal", "Abnormal"]),
    range: z.string(),
    contribution: z.number()
  })),
  classification_logic: z.object({
    abnormal_count: z.number(),
    rule_applied: z.string(),
    confidence_basis: z.string()
  })
});

export type MedicalRanges = z.infer<typeof medicalRangesSchema>;
export type DatasetStats = z.infer<typeof datasetStatsSchema>;
export type RuleBasedResult = z.infer<typeof ruleBasedResultSchema>;

// Google Colab Constants
export const GOOGLE_COLAB_CONSTANTS = {
  DATASET_SOURCE: "Kaggle Patient Health Scores for EHR Data",
  TOTAL_SAMPLES: 79540,
  ALGORITHM: "Google Colab Rule-based Classification",
  NOTEBOOK_URL: "https://colab.research.google.com/drive/1pTKHyg4yHPOc5qjaG6j2isdwtvtFmyZ-",
  KAGGLE_URL: "https://www.kaggle.com/datasets/hansaniuma/patient-health-scores-for-ehr-data",
  DISTRIBUTION: {
    NORMAL_PERCENTAGE: 68.0,
    KURANG_NORMAL_PERCENTAGE: 25.2,
    BERBAHAYA_PERCENTAGE: 6.8
  }
} as const;