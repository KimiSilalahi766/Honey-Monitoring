import { z } from "zod";
import { pgTable, serial, varchar, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

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
  }),
  explanation: z.string().optional().describe("Naive Bayes calculation explanation"),
  features_impact: z.record(z.string(), z.number()).optional().describe("Individual feature contributions")
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

// Naive Bayes Analysis Schema
export const naiveBayesAnalysisSchema = z.object({
  training_data_count: z.number(),
  feature_importance: z.record(z.string(), z.number()),
  class_distributions: z.record(z.string(), z.number()),
  model_accuracy: z.number(),
  last_trained: z.string()
});

export type NaiveBayesAnalysis = z.infer<typeof naiveBayesAnalysisSchema>;

// Database Tables
export const heartMonitoringData = pgTable('heart_monitoring_data', {
  id: serial('id').primaryKey(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  device_id: varchar('device_id', { length: 100 }).notNull().default('ESP32_Monitor_Jantung'),
  suhu: real('suhu').notNull(),
  bpm: integer('bpm').notNull(),
  spo2: integer('spo2').notNull(),
  tekanan_sys: integer('tekanan_sys').notNull(),
  tekanan_dia: integer('tekanan_dia').notNull(),
  signal_quality: integer('signal_quality').notNull(),
  kondisi: varchar('kondisi', { length: 50 }).notNull(),
  nb_classification: varchar('nb_classification', { length: 50 }),
  nb_confidence: real('nb_confidence'),
  created_at: timestamp('created_at').defaultNow().notNull()
});

export const naiveBayesTrainingData = pgTable('naive_bayes_training_data', {
  id: serial('id').primaryKey(),
  suhu: real('suhu').notNull(),
  bpm: integer('bpm').notNull(),
  spo2: integer('spo2').notNull(),
  tekanan_sys: integer('tekanan_sys').notNull(),
  tekanan_dia: integer('tekanan_dia').notNull(),
  signal_quality: integer('signal_quality').notNull(),
  label: varchar('label', { length: 50 }).notNull(),
  is_calibrated: integer('is_calibrated').default(1),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Insert schemas
export const insertHeartMonitoringDataSchema = createInsertSchema(heartMonitoringData).omit({
  id: true,
  created_at: true,
  timestamp: true
});

export const insertNaiveBayesTrainingDataSchema = createInsertSchema(naiveBayesTrainingData).omit({
  id: true,
  created_at: true
});

// Types
export type HeartMonitoringData = typeof heartMonitoringData.$inferSelect;
export type InsertHeartMonitoringData = z.infer<typeof insertHeartMonitoringDataSchema>;
export type NaiveBayesTrainingDataType = typeof naiveBayesTrainingData.$inferSelect;
export type InsertNaiveBayesTrainingData = z.infer<typeof insertNaiveBayesTrainingDataSchema>;
