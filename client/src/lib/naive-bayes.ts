import type { ClassificationRequest, ClassificationResponse } from '@shared/schema';

// Training data for Naive Bayes classifier
// Based on medical ranges and thesis requirements
const trainingData = [
  // Normal cases
  { suhu: 36.5, bpm: 72, spo2: 98, tekanan_sys: 115, tekanan_dia: 75, signal_quality: 85, label: 'Normal' },
  { suhu: 36.8, bpm: 78, spo2: 97, tekanan_sys: 110, tekanan_dia: 70, signal_quality: 90, label: 'Normal' },
  { suhu: 37.0, bpm: 65, spo2: 99, tekanan_sys: 105, tekanan_dia: 68, signal_quality: 88, label: 'Normal' },
  { suhu: 36.7, bpm: 80, spo2: 96, tekanan_sys: 118, tekanan_dia: 78, signal_quality: 92, label: 'Normal' },
  { suhu: 36.9, bpm: 75, spo2: 98, tekanan_sys: 112, tekanan_dia: 72, signal_quality: 87, label: 'Normal' },
  
  // Kurang Normal cases (1-2 parameters abnormal)
  { suhu: 37.8, bpm: 75, spo2: 97, tekanan_sys: 115, tekanan_dia: 75, signal_quality: 80, label: 'Kurang Normal' },
  { suhu: 36.5, bpm: 105, spo2: 98, tekanan_sys: 115, tekanan_dia: 75, signal_quality: 85, label: 'Kurang Normal' },
  { suhu: 36.8, bpm: 78, spo2: 94, tekanan_sys: 115, tekanan_dia: 75, signal_quality: 82, label: 'Kurang Normal' },
  { suhu: 36.7, bpm: 82, spo2: 97, tekanan_sys: 135, tekanan_dia: 85, signal_quality: 88, label: 'Kurang Normal' },
  { suhu: 35.8, bpm: 78, spo2: 98, tekanan_sys: 115, tekanan_dia: 75, signal_quality: 75, label: 'Kurang Normal' },
  
  // Berbahaya cases (3+ parameters abnormal)
  { suhu: 38.5, bpm: 115, spo2: 92, tekanan_sys: 145, tekanan_dia: 95, signal_quality: 65, label: 'Berbahaya' },
  { suhu: 39.0, bpm: 125, spo2: 89, tekanan_sys: 155, tekanan_dia: 100, signal_quality: 60, label: 'Berbahaya' },
  { suhu: 35.0, bpm: 45, spo2: 88, tekanan_sys: 90, tekanan_dia: 50, signal_quality: 55, label: 'Berbahaya' },
  { suhu: 38.2, bpm: 110, spo2: 90, tekanan_sys: 140, tekanan_dia: 90, signal_quality: 70, label: 'Berbahaya' },
  { suhu: 37.5, bpm: 120, spo2: 91, tekanan_sys: 150, tekanan_dia: 95, signal_quality: 68, label: 'Berbahaya' },
];

interface ClassificationModel {
  labels: string[];
  features: string[];
  priors: Record<string, number>;
  likelihoods: Record<string, Record<string, { mean: number; variance: number }>>;
}

class NaiveBayesClassifier {
  private model: ClassificationModel | null = null;

  train(data: typeof trainingData) {
    const labels = Array.from(new Set(data.map(d => d.label)));
    const features = ['suhu', 'bpm', 'spo2', 'tekanan_sys', 'tekanan_dia', 'signal_quality'];
    
    // Calculate priors
    const priors: Record<string, number> = {};
    labels.forEach(label => {
      priors[label] = data.filter(d => d.label === label).length / data.length;
    });

    // Calculate likelihoods (mean and variance for each feature per class)
    const likelihoods: Record<string, Record<string, { mean: number; variance: number }>> = {};
    
    labels.forEach(label => {
      likelihoods[label] = {};
      const classData = data.filter(d => d.label === label);
      
      features.forEach(feature => {
        const values = classData.map(d => (d as any)[feature]);
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        
        likelihoods[label][feature] = { mean, variance: variance || 0.01 }; // Prevent division by zero
      });
    });

    this.model = { labels, features, priors, likelihoods };
  }

  predict(input: ClassificationRequest): ClassificationResponse {
    if (!this.model) {
      throw new Error('Model not trained');
    }

    // Apply calibration to blood pressure values for calculation
    const calibratedInput = {
      ...input,
      tekanan_sys: input.tekanan_sys - 15, // Calibration -15 for systolic
      tekanan_dia: input.tekanan_dia - 10  // Calibration -10 for diastolic
    };

    const { labels, features, priors, likelihoods } = this.model;
    const probabilities: Record<string, number> = {};
    const featureContributions: Record<string, number> = {};
    const detailedCalculations: string[] = [];

    // Calculate probability for each class with detailed explanation
    labels.forEach(label => {
      let logProb = Math.log(priors[label]);
      detailedCalculations.push(`\n=== Kalkulasi untuk kelas '${label}' ===`);
      detailedCalculations.push(`Prior P(${label}) = ${(priors[label] * 100).toFixed(2)}%`);
      
      features.forEach(feature => {
        const value = (calibratedInput as any)[feature];
        const { mean, variance } = likelihoods[label][feature];
        
        // Gaussian probability density function
        const prob = Math.exp(-Math.pow(value - mean, 2) / (2 * variance)) / 
                    Math.sqrt(2 * Math.PI * variance);
        
        // Calculate feature importance for this prediction
        const featureLogProb = Math.log(prob || 1e-10);
        featureContributions[feature] = (featureContributions[feature] || 0) + Math.abs(featureLogProb);
        
        logProb += featureLogProb;
        
        // Add detailed explanation
        detailedCalculations.push(
          `  ${this.getFeatureName(feature)}: ${value} (mean=${mean.toFixed(2)}, likelihood=${(prob * 100).toFixed(4)}%)`
        );
      });
      
      probabilities[label] = Math.exp(logProb);
      detailedCalculations.push(`  Total log probability: ${logProb.toFixed(4)}`);
    });

    // Normalize probabilities
    const total = Object.values(probabilities).reduce((sum, prob) => sum + prob, 0);
    Object.keys(probabilities).forEach(label => {
      probabilities[label] = probabilities[label] / total;
    });

    // Normalize feature contributions
    const totalContribution = Object.values(featureContributions).reduce((sum, val) => sum + val, 0);
    Object.keys(featureContributions).forEach(feature => {
      featureContributions[feature] = featureContributions[feature] / totalContribution;
    });

    // Get classification with highest probability
    const classification = Object.entries(probabilities)
      .reduce((max, [label, prob]) => prob > max.prob ? { label, prob } : max, 
              { label: labels[0], prob: 0 }).label as "Normal" | "Kurang Normal" | "Berbahaya";

    // Generate comprehensive explanation
    const explanation = `Naive Bayes menganalisis 6 parameter vital:\n${detailedCalculations.join('\n')}\n\n` +
                       `Hasil Final: ${classification} dengan confidence ${(probabilities[classification] * 100).toFixed(1)}%\n` +
                       `Algoritma menghitung probabilitas setiap kelas berdasarkan distribusi Gaussian dari training data.`;

    return {
      classification,
      confidence: probabilities[classification],
      probabilities: probabilities as any,
      explanation,
      features_impact: featureContributions
    };
  }

  private getFeatureName(feature: string): string {
    const featureNames: Record<string, string> = {
      suhu: 'Suhu Tubuh',
      bpm: 'Detak Jantung', 
      spo2: 'Kadar Oksigen',
      tekanan_sys: 'Tekanan Sistolik',
      tekanan_dia: 'Tekanan Diastolik',
      signal_quality: 'Kualitas Sinyal'
    };
    return featureNames[feature] || feature;
  }

  // Get model statistics for analysis
  getModelStats() {
    if (!this.model) return null;
    
    const { labels, features, priors, likelihoods } = this.model;
    
    return {
      training_data_count: trainingData.length,
      class_distributions: priors,
      feature_count: features.length,
      model_complexity: labels.length * features.length,
      feature_stats: Object.fromEntries(
        features.map(feature => [
          feature,
          Object.fromEntries(
            labels.map(label => [
              label,
              {
                mean: likelihoods[label][feature].mean,
                variance: likelihoods[label][feature].variance,
                std_dev: Math.sqrt(likelihoods[label][feature].variance)
              }
            ])
          )
        ])
      )
    };
  }

  // Public method to get feature names
  public getFeatureNamePublic(feature: string): string {
    return this.getFeatureName(feature);
  }
}

// Initialize and train the classifier
export const heartClassifier = new NaiveBayesClassifier();
heartClassifier.train(trainingData);

// Client-side classification function
export const classifyHeartCondition = (data: ClassificationRequest): ClassificationResponse => {
  return heartClassifier.predict(data);
};

// Get comprehensive model analysis
export const getNaiveBayesAnalysis = () => {
  const stats = heartClassifier.getModelStats();
  if (!stats) return null;
  
  return {
    ...stats,
    training_data: trainingData,
    algorithm_explanation: `
      ALGORITMA NAIVE BAYES UNTUK MONITORING JANTUNG:
      
      1. TRAINING PHASE:
         - Dataset: ${trainingData.length} sampel data medis terkalibrasi
         - Features: 6 parameter vital (suhu, BPM, SpO2, tekanan darah, kualitas sinyal)
         - Classes: 3 kategori kondisi jantung
      
      2. CLASSIFICATION PHASE:
         - Menghitung Prior: P(Normal) = ${(stats.class_distributions.Normal * 100).toFixed(1)}%
         - Menghitung Likelihood: P(feature|class) menggunakan distribusi Gaussian
         - Menghitung Posterior: P(class|features) = P(features|class) × P(class)
      
      3. DECISION MAKING:
         - Pilih kelas dengan probabilitas posterior tertinggi
         - Confidence = probabilitas kelas terpilih
         - Threshold: Normal >60%, Kurang Normal 30-60%, Berbahaya <30%
    `,
    medical_calibration: {
      systolic_adjustment: -15,
      diastolic_adjustment: -10,
      rationale: "Kalibrasi berdasarkan konsultasi medis untuk akurasi sensor ESP32"
    }
  };
};

// Export training data for analysis
export { trainingData };

// Feature importance calculator
export const calculateFeatureImportance = (data: ClassificationRequest) => {
  const result = classifyHeartCondition(data);
  const importance = result.features_impact || {};
  
  return Object.entries(importance)
    .sort(([,a], [,b]) => b - a)
    .map(([feature, impact]) => ({
      feature: heartClassifier.getFeatureNamePublic(feature),
      impact: impact * 100,
      value: (data as any)[feature]
    }));
};
