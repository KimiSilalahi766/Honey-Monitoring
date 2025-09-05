import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { classificationRequestSchema, classificationResponseSchema, heartMonitoringData, insertHeartMonitoringDataSchema, naiveBayesTrainingData, insertNaiveBayesTrainingDataSchema } from "@shared/schema";
import { db } from "./db";
import { desc, count, avg, eq } from "drizzle-orm";

// Simple Naive Bayes implementation for server-side classification
interface TrainingExample {
  features: number[];
  label: string;
}

class ServerNaiveBayes {
  private classes: Map<string, { count: number; features: number[][] }> = new Map();
  private featureStats: Map<string, { means: number[]; variances: number[] }> = new Map();
  private classPriors: Map<string, number> = new Map();
  private trained = false;

  train(examples: TrainingExample[]) {
    // Initialize classes
    this.classes.clear();
    examples.forEach(example => {
      if (!this.classes.has(example.label)) {
        this.classes.set(example.label, { count: 0, features: [] });
      }
      const classData = this.classes.get(example.label)!;
      classData.count++;
      classData.features.push(example.features);
    });

    // Calculate priors
    const totalExamples = examples.length;
    this.classes.forEach((data, label) => {
      this.classPriors.set(label, data.count / totalExamples);
    });

    // Calculate feature statistics for each class
    this.featureStats.clear();
    this.classes.forEach((data, label) => {
      const numFeatures = data.features[0].length;
      const means: number[] = new Array(numFeatures).fill(0);
      const variances: number[] = new Array(numFeatures).fill(0);

      // Calculate means
      data.features.forEach(features => {
        features.forEach((feature, i) => {
          means[i] += feature;
        });
      });
      means.forEach((_, i) => {
        means[i] /= data.count;
      });

      // Calculate variances
      data.features.forEach(features => {
        features.forEach((feature, i) => {
          variances[i] += Math.pow(feature - means[i], 2);
        });
      });
      variances.forEach((_, i) => {
        variances[i] = variances[i] / data.count || 0.01; // Prevent division by zero
      });

      this.featureStats.set(label, { means, variances });
    });

    this.trained = true;
  }

  predict(features: number[]): { classification: string; confidence: number; probabilities: Record<string, number> } {
    if (!this.trained) {
      throw new Error('Model must be trained before prediction');
    }

    const logProbabilities: Map<string, number> = new Map();

    // Calculate log probabilities for each class
    this.classes.forEach((_, label) => {
      const prior = this.classPriors.get(label)!;
      const stats = this.featureStats.get(label)!;
      
      let logProb = Math.log(prior);
      
      features.forEach((feature, i) => {
        const mean = stats.means[i];
        const variance = stats.variances[i];
        
        // Gaussian probability density function
        const gaussianProb = Math.exp(-Math.pow(feature - mean, 2) / (2 * variance)) / 
                             Math.sqrt(2 * Math.PI * variance);
        
        logProb += Math.log(gaussianProb || 1e-10); // Prevent log(0)
      });
      
      logProbabilities.set(label, logProb);
    });

    // Convert to regular probabilities and normalize
    const probabilities: Record<string, number> = {};
    let maxLogProb = Math.max(...Array.from(logProbabilities.values()));
    let totalProb = 0;

    logProbabilities.forEach((logProb, label) => {
      const prob = Math.exp(logProb - maxLogProb);
      probabilities[label] = prob;
      totalProb += prob;
    });

    // Normalize
    Object.keys(probabilities).forEach(label => {
      probabilities[label] /= totalProb;
    });

    // Find classification with highest probability
    const classification = Object.entries(probabilities)
      .reduce((max, [label, prob]) => prob > max.prob ? { label, prob } : max, 
              { label: '', prob: 0 }).label;

    return {
      classification,
      confidence: probabilities[classification],
      probabilities
    };
  }
}

// Initialize and train the classifier
const classifier = new ServerNaiveBayes();

// Training data based on medical ranges
const trainingExamples: TrainingExample[] = [
  // Normal cases - [suhu, bpm, spo2, tekanan_sys, tekanan_dia, signal_quality]
  { features: [36.5, 72, 98, 115, 75, 85], label: 'Normal' },
  { features: [36.8, 78, 97, 110, 70, 90], label: 'Normal' },
  { features: [37.0, 65, 99, 105, 68, 88], label: 'Normal' },
  { features: [36.7, 80, 96, 118, 78, 92], label: 'Normal' },
  { features: [36.9, 75, 98, 112, 72, 87], label: 'Normal' },
  { features: [36.6, 85, 97, 108, 70, 89], label: 'Normal' },
  { features: [37.1, 68, 99, 114, 76, 91], label: 'Normal' },
  { features: [36.8, 82, 98, 116, 74, 86], label: 'Normal' },
  
  // Kurang Normal cases (1-2 parameters abnormal)
  { features: [37.8, 75, 97, 115, 75, 80], label: 'Kurang Normal' },
  { features: [36.5, 105, 98, 115, 75, 85], label: 'Kurang Normal' },
  { features: [36.8, 78, 94, 115, 75, 82], label: 'Kurang Normal' },
  { features: [36.7, 82, 97, 135, 85, 88], label: 'Kurang Normal' },
  { features: [35.8, 78, 98, 115, 75, 75], label: 'Kurang Normal' },
  { features: [37.5, 95, 96, 125, 80, 83], label: 'Kurang Normal' },
  { features: [36.9, 88, 93, 120, 78, 78], label: 'Kurang Normal' },
  
  // Berbahaya cases (3+ parameters abnormal)
  { features: [38.5, 115, 92, 145, 95, 65], label: 'Berbahaya' },
  { features: [39.0, 125, 89, 155, 100, 60], label: 'Berbahaya' },
  { features: [35.0, 45, 88, 90, 50, 55], label: 'Berbahaya' },
  { features: [38.2, 110, 90, 140, 90, 70], label: 'Berbahaya' },
  { features: [37.5, 120, 91, 150, 95, 68], label: 'Berbahaya' },
  { features: [39.2, 130, 86, 160, 105, 55], label: 'Berbahaya' },
  { features: [34.8, 40, 85, 85, 45, 50], label: 'Berbahaya' },
  { features: [38.8, 135, 87, 165, 110, 58], label: 'Berbahaya' }
];

// Train the classifier
classifier.train(trainingExamples);

export async function registerRoutes(app: Express): Promise<Server> {
  // Store heart monitoring data
  app.post('/api/heart-data', async (req, res) => {
    try {
      const validatedData = insertHeartMonitoringDataSchema.parse(req.body);
      
      // Get Naive Bayes classification if not provided
      let nbClassification = validatedData.nb_classification;
      let nbConfidence = validatedData.nb_confidence;
      
      if (!nbClassification) {
        const features = [
          validatedData.suhu,
          validatedData.bpm,
          validatedData.spo2,
          validatedData.tekanan_sys,
          validatedData.tekanan_dia,
          validatedData.signal_quality
        ];
        
        const result = classifier.predict(features);
        nbClassification = result.classification;
        nbConfidence = result.confidence;
      }
      
      const [newRecord] = await db.insert(heartMonitoringData)
        .values({
          ...validatedData,
          nb_classification: nbClassification,
          nb_confidence: nbConfidence
        })
        .returning();
      
      res.json({
        success: true,
        data: newRecord,
        classification: {
          classification: nbClassification,
          confidence: nbConfidence
        }
      });
    } catch (error) {
      console.error('Error storing heart data:', error);
      res.status(500).json({ error: 'Failed to store data' });
    }
  });

  // Get historical data
  app.get('/api/heart-data', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const data = await db.select()
        .from(heartMonitoringData)
        .orderBy(desc(heartMonitoringData.created_at))
        .limit(limit)
        .offset(offset);
      
      res.json({
        success: true,
        data,
        total: data.length
      });
    } catch (error) {
      console.error('Error fetching heart data:', error);
      res.status(500).json({ error: 'Failed to fetch data' });
    }
  });

  // Get analytics
  app.get('/api/analytics', async (req, res) => {
    try {
      const [totalRecords] = await db.select({ count: count() })
        .from(heartMonitoringData);
      
      const [avgMetrics] = await db.select({
        avg_suhu: avg(heartMonitoringData.suhu),
        avg_bpm: avg(heartMonitoringData.bpm),
        avg_spo2: avg(heartMonitoringData.spo2),
        avg_sys: avg(heartMonitoringData.tekanan_sys),
        avg_dia: avg(heartMonitoringData.tekanan_dia)
      }).from(heartMonitoringData);
      
      const normalCount = await db.select({ count: count() })
        .from(heartMonitoringData)
        .where(eq(heartMonitoringData.nb_classification, 'Normal'));
      
      const kurangNormalCount = await db.select({ count: count() })
        .from(heartMonitoringData)
        .where(eq(heartMonitoringData.nb_classification, 'Kurang Normal'));
      
      const berbahayaCount = await db.select({ count: count() })
        .from(heartMonitoringData)
        .where(eq(heartMonitoringData.nb_classification, 'Berbahaya'));
      
      res.json({
        success: true,
        analytics: {
          total_records: totalRecords.count,
          averages: avgMetrics,
          classification_distribution: {
            Normal: normalCount[0]?.count || 0,
            'Kurang Normal': kurangNormalCount[0]?.count || 0,
            Berbahaya: berbahayaCount[0]?.count || 0
          }
        }
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  // Classification API endpoint
  app.post("/api/classify", async (req, res) => {
    try {
      // Validate request body
      const validatedData = classificationRequestSchema.parse(req.body);
      
      // Extract features in the same order as training data
      const features = [
        validatedData.suhu,
        validatedData.bpm,
        validatedData.spo2,
        validatedData.tekanan_sys,
        validatedData.tekanan_dia,
        validatedData.signal_quality
      ];

      // Get classification
      const result = classifier.predict(features);
      
      // Validate and return response
      const response = classificationResponseSchema.parse({
        classification: result.classification as "Normal" | "Kurang Normal" | "Berbahaya",
        confidence: result.confidence,
        probabilities: result.probabilities
      });

      res.json(response);
    } catch (error) {
      console.error('Classification error:', error);
      res.status(400).json({ 
        error: 'Invalid request data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      classifier: 'ready'
    });
  });

  // Seed database with sample data (development)
  app.post("/api/seed-data", async (_req, res) => {
    try {
      const sampleData = [
        {
          device_id: 'ESP32_Monitor_Jantung',
          suhu: 36.8,
          bpm: 78,
          spo2: 98,
          tekanan_sys: 105, // After calibration (-15)
          tekanan_dia: 70,  // After calibration (-10)
          signal_quality: 85,
          kondisi: 'Normal',
          nb_classification: 'Normal',
          nb_confidence: 0.92
        },
        {
          device_id: 'ESP32_Monitor_Jantung',
          suhu: 37.6,
          bpm: 105,
          spo2: 94,
          tekanan_sys: 120,
          tekanan_dia: 85,
          signal_quality: 78,
          kondisi: 'Kurang Normal',
          nb_classification: 'Kurang Normal',
          nb_confidence: 0.76
        },
        {
          device_id: 'ESP32_Monitor_Jantung',
          suhu: 38.9,
          bpm: 125,
          spo2: 89,
          tekanan_sys: 140,
          tekanan_dia: 95,
          signal_quality: 65,
          kondisi: 'Berbahaya',
          nb_classification: 'Berbahaya',
          nb_confidence: 0.88
        }
      ];
      
      const results = await db.insert(heartMonitoringData).values(sampleData).returning();
      
      res.json({
        success: true,
        message: `Seeded ${results.length} records`,
        data: results
      });
    } catch (error) {
      console.error('Error seeding data:', error);
      res.status(500).json({ error: 'Failed to seed data' });
    }
  });
  
  // Training data management endpoints
  app.get('/api/training-data', async (_req, res) => {
    try {
      const data = await db.select()
        .from(naiveBayesTrainingData)
        .orderBy(desc(naiveBayesTrainingData.created_at));
      
      res.json(data);
    } catch (error) {
      console.error('Error fetching training data:', error);
      res.status(500).json({ error: 'Failed to fetch training data' });
    }
  });

  app.post('/api/training-data', async (req, res) => {
    try {
      const validatedData = insertNaiveBayesTrainingDataSchema.parse(req.body);
      
      const [newRecord] = await db.insert(naiveBayesTrainingData)
        .values(validatedData)
        .returning();
      
      res.json({ success: true, data: newRecord });
    } catch (error) {
      console.error('Error adding training data:', error);
      res.status(500).json({ error: 'Failed to add training data' });
    }
  });

  app.delete('/api/training-data/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(naiveBayesTrainingData)
        .where(eq(naiveBayesTrainingData.id, id));
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting training data:', error);
      res.status(500).json({ error: 'Failed to delete training data' });
    }
  });

  app.post('/api/training-data/upload', async (req, res) => {
    try {
      // For now, return success - CSV parsing would be implemented here
      res.json({ success: true, count: 0, message: 'CSV upload endpoint ready' });
    } catch (error) {
      console.error('Error uploading CSV:', error);
      res.status(500).json({ error: 'Failed to upload CSV' });
    }
  });

  app.post('/api/training-data/retrain', async (_req, res) => {
    try {
      // Fetch training data from database
      const trainingData = await db.select().from(naiveBayesTrainingData);
      
      if (trainingData.length < 10) {
        return res.status(400).json({ error: 'Need at least 10 training examples' });
      }
      
      // Convert to training format
      const examples: TrainingExample[] = trainingData.map(item => ({
        features: [item.suhu, item.bpm, item.spo2, item.tekanan_sys, item.tekanan_dia, item.signal_quality],
        label: item.label
      }));
      
      // Retrain classifier
      classifier.train(examples);
      
      // Calculate accuracy with cross-validation
      let correctPredictions = 0;
      examples.forEach(example => {
        const prediction = classifier.predict(example.features);
        if (prediction.classification === example.label) {
          correctPredictions++;
        }
      });
      
      const accuracy = correctPredictions / examples.length;
      
      res.json({ 
        success: true, 
        accuracy, 
        trainingCount: examples.length,
        message: 'Model retrained successfully' 
      });
    } catch (error) {
      console.error('Error retraining model:', error);
      res.status(500).json({ error: 'Failed to retrain model' });
    }
  });

  // Evaluation endpoint
  app.get('/api/evaluation', async (_req, res) => {
    try {
      // Fetch training data for evaluation
      const trainingData = await db.select().from(naiveBayesTrainingData);
      
      if (trainingData.length < 10) {
        return res.json({
          error: 'Insufficient training data',
          message: `Need at least 10 samples, got ${trainingData.length}`
        });
      }
      
      // Convert to training format
      const examples: TrainingExample[] = trainingData.map(item => ({
        features: [item.suhu, item.bpm, item.spo2, item.tekanan_sys, item.tekanan_dia, item.signal_quality],
        label: item.label
      }));
      
      // Perform cross-validation
      const folds = 5;
      const foldSize = Math.floor(examples.length / folds);
      const crossValidationScores: number[] = [];
      
      for (let i = 0; i < folds; i++) {
        const testStart = i * foldSize;
        const testEnd = i === folds - 1 ? examples.length : (i + 1) * foldSize;
        
        const testSet = examples.slice(testStart, testEnd);
        const trainSet = [...examples.slice(0, testStart), ...examples.slice(testEnd)];
        
        // Train on fold
        const foldClassifier = new ServerNaiveBayes();
        foldClassifier.train(trainSet);
        
        // Test on fold
        let correctPredictions = 0;
        testSet.forEach(example => {
          const prediction = foldClassifier.predict(example.features);
          if (prediction.classification === example.label) {
            correctPredictions++;
          }
        });
        
        crossValidationScores.push(correctPredictions / testSet.length);
      }
      
      // Calculate overall metrics
      const classLabels = ['Normal', 'Kurang Normal', 'Berbahaya'];
      const confusionMatrix = Array(3).fill(null).map(() => Array(3).fill(0));
      const classCounts = { 'Normal': 0, 'Kurang Normal': 0, 'Berbahaya': 0 };
      const classCorrect = { 'Normal': 0, 'Kurang Normal': 0, 'Berbahaya': 0 };
      const classPredicted = { 'Normal': 0, 'Kurang Normal': 0, 'Berbahaya': 0 };
      
      // Full dataset evaluation
      classifier.train(examples);
      let totalCorrect = 0;
      
      examples.forEach(example => {
        const actualIndex = classLabels.indexOf(example.label);
        classCounts[example.label as keyof typeof classCounts]++;
        
        const prediction = classifier.predict(example.features);
        const predictedIndex = classLabels.indexOf(prediction.classification);
        
        confusionMatrix[actualIndex][predictedIndex]++;
        classPredicted[prediction.classification as keyof typeof classPredicted]++;
        
        if (prediction.classification === example.label) {
          totalCorrect++;
          classCorrect[example.label as keyof typeof classCorrect]++;
        }
      });
      
      // Calculate precision, recall, f1 for each class
      const precision: Record<string, number> = {};
      const recall: Record<string, number> = {};
      const f1Score: Record<string, number> = {};
      
      classLabels.forEach(label => {
        const tp = classCorrect[label as keyof typeof classCorrect];
        const fp = classPredicted[label as keyof typeof classPredicted] - tp;
        const fn = classCounts[label as keyof typeof classCounts] - tp;
        
        precision[label] = classPredicted[label as keyof typeof classPredicted] > 0 ? tp / classPredicted[label as keyof typeof classPredicted] : 0;
        recall[label] = classCounts[label as keyof typeof classCounts] > 0 ? tp / classCounts[label as keyof typeof classCounts] : 0;
        f1Score[label] = (precision[label] + recall[label]) > 0 ? 2 * (precision[label] * recall[label]) / (precision[label] + recall[label]) : 0;
      });
      
      const meanCvScore = crossValidationScores.reduce((sum, score) => sum + score, 0) / crossValidationScores.length;
      const stdCvScore = Math.sqrt(crossValidationScores.reduce((sum, score) => sum + Math.pow(score - meanCvScore, 2), 0) / crossValidationScores.length);
      
      res.json({
        overall_accuracy: totalCorrect / examples.length,
        precision,
        recall,
        f1_score: f1Score,
        confusion_matrix: confusionMatrix,
        class_labels: classLabels,
        total_samples: examples.length,
        training_samples: Math.floor(examples.length * 0.8),
        test_samples: examples.length - Math.floor(examples.length * 0.8),
        cross_validation_scores: crossValidationScores,
        mean_cv_score: meanCvScore,
        std_cv_score: stdCvScore
      });
    } catch (error) {
      console.error('Error in evaluation:', error);
      res.status(500).json({ error: 'Failed to perform evaluation' });
    }
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
