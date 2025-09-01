import { z } from "zod";

// Heart monitoring data schema based on ESP32 IoT device
export const heartDataSchema = z.object({
  timestamp: z.number().describe("Unix timestamp from ESP32"),
  suhu: z.number().min(20).max(45).describe("Temperature in Celsius"),
  bpm: z.number().min(30).max(200).describe("Heart rate in beats per minute"),
  spo2: z.number().min(70).max(100).describe("Blood oxygen saturation percentage"),
  tekanan_sys: z.number().min(70).max(200).describe("Systolic blood pressure in mmHg"),
  tekanan_dia: z.number().min(40).max(130).describe("Diastolic blood pressure in mmHg"),
  signal_quality: z.number().min(0).max(100).describe("Signal quality percentage"),
  kondisi: z.enum(["Normal", "Kurang Normal", "Berbahaya"]).describe("Initial rule-based classification")
});

export const heartDataWithIdSchema = heartDataSchema.extend({
  id: z.string().describe("Firebase path identifier")
});

// Classification request schema
export const classificationRequestSchema = z.object({
  suhu: z.number(),
  bpm: z.number(),
  spo2: z.number(),
  tekanan_sys: z.number(),
  tekanan_dia: z.number(),
  signal_quality: z.number()
});

// Classification response schema
export const classificationResponseSchema = z.object({
  classification: z.enum(["Normal", "Kurang Normal", "Berbahaya"]),
  confidence: z.number().min(0).max(1),
  probabilities: z.object({
    Normal: z.number(),
    "Kurang Normal": z.number(),
    Berbahaya: z.number()
  })
});

export type HeartData = z.infer<typeof heartDataSchema>;
export type HeartDataWithId = z.infer<typeof heartDataWithIdSchema>;
export type ClassificationRequest = z.infer<typeof classificationRequestSchema>;
export type ClassificationResponse = z.infer<typeof classificationResponseSchema>;

// Helper types for parameter status
export type ParameterStatus = 'normal' | 'warning' | 'danger';

export interface ParameterInfo {
  value: number;
  unit: string;
  status: ParameterStatus;
  range: string;
  icon: string;
}
