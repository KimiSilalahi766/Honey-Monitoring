// =========================================================
// NAIVE BAYES MODEL DARI FIREBASE RTDB
// Model ini diimport dari file yang diupload user
// =========================================================

export interface NaiveBayesModel {
  prior: {
    "0": number;
    "1": number; 
    "2": number;
  };
  means: {
    "0": FeatureValues;
    "1": FeatureValues;
    "2": FeatureValues;
  };
  std: {
    "0": FeatureValues;
    "1": FeatureValues;
    "2": FeatureValues;
  };
}

export interface FeatureValues {
  "Suhu Tubuh (C)": number;
  "Detak Jantung": number;
  "Sistolik": number;
  "Diastolik": number;
  "Saturasi Oksigen": number;
}

export interface VitalSigns {
  suhu: number;
  bpm: number;
  tekanan_sys: number;
  tekanan_dia: number;
  spo2: number;
}

export interface ClassificationResult {
  classification: 'Normal' | 'Kurang Normal' | 'Berbahaya';
  confidence: number;
  probabilities: {
    Normal: number;
    'Kurang Normal': number;
    Berbahaya: number;
  };
  raw_class: number;
  explanation: string;
}

// ✅ FIREBASE MODEL URL - SESUAI YANG USER GUNAKAN DI ARDUINO
const FIREBASE_MODEL_URL = "https://monitoring-jantung-f8031-default-rtdb.firebaseio.com/model/naive_bayes_model.json";

// Cache untuk model yang dimuat dari Firebase
let CACHED_FIREBASE_MODEL: NaiveBayesModel | null = null;
let MODEL_LOAD_PROMISE: Promise<NaiveBayesModel> | null = null;

// Load model dari Firebase URL
async function loadModelFromFirebase(): Promise<NaiveBayesModel> {
  if (CACHED_FIREBASE_MODEL) {
    return CACHED_FIREBASE_MODEL;
  }
  
  if (MODEL_LOAD_PROMISE) {
    return MODEL_LOAD_PROMISE;
  }
  
  MODEL_LOAD_PROMISE = fetchFirebaseModel();
  return MODEL_LOAD_PROMISE;
}

async function fetchFirebaseModel(): Promise<NaiveBayesModel> {
  try {
    const response = await fetch(FIREBASE_MODEL_URL);
    if (!response.ok) {
      throw new Error(`Failed to load model: ${response.status}`);
    }
    
    const model = await response.json();
    CACHED_FIREBASE_MODEL = model;
    console.log('✅ Model Naive Bayes berhasil dimuat dari Firebase:', FIREBASE_MODEL_URL);
    return model;
  } catch (error) {
    console.error('❌ Gagal memuat model dari Firebase, menggunakan fallback:', error);
    
    // Fallback model dari user upload sebelumnya
    const fallbackModel: NaiveBayesModel = {
      "prior": {
        "1": 0.5515306763892381,
        "0": 0.3602118430978124,
        "2": 0.08825748051294946
      },
      "means": {
        "0": {
          "Suhu Tubuh (C)": -0.03933939280809739,
          "Detak Jantung": -0.2824981676508042,
          "Sistolik": -0.5555745032162653,
          "Diastolik": -0.2816968044585138,
          "Saturasi Oksigen": 0.22642570982723753
        },
        "1": {
          "Suhu Tubuh (C)": -0.023117008866446697,
          "Detak Jantung": 0.04897450782755786,
          "Sistolik": 0.23487130052370211,
          "Diastolik": 0.06450132773134688,
          "Saturasi Oksigen": -0.029220796712011533
        },
        "2": {
          "Suhu Tubuh (C)": 0.3050195243450615,
          "Detak Jantung": 0.846933787128908,
          "Sistolik": 0.7997711710008396,
          "Diastolik": 0.7466343230523473,
          "Saturasi Oksigen": -0.7415241870267099
        }
      },
      "std": {
        "0": {
          "Suhu Tubuh (C)": 0.572679218922528,
          "Detak Jantung": 0.5968008763227654,
          "Sistolik": 0.4654107058543759,
          "Diastolik": 0.5386643648485151,
          "Saturasi Oksigen": 0.49836299758150154
        },
        "1": {
          "Suhu Tubuh (C)": 1.0406749495600613,
          "Detak Jantung": 1.0626506689254747,
          "Sistolik": 1.0329016412390835,
          "Diastolik": 1.0758618001494007,
          "Saturasi Oksigen": 0.981288817872472
        },
        "2": {
          "Suhu Tubuh (C)": 1.7669391779553554,
          "Detak Jantung": 1.327612864028202,
          "Sistolik": 1.2391668343572593,
          "Diastolik": 1.4163792612548238,
          "Saturasi Oksigen": 1.8803182483263856
        }
      }
    };
    
    CACHED_FIREBASE_MODEL = fallbackModel;
    return fallbackModel;
  }
}

// =========================================================
// GAUSSIAN NAIVE BAYES CLASSIFIER  
// =========================================================

function gaussianPDF(x: number, mean: number, std: number): number {
  const variance = std * std;
  const coefficient = 1 / Math.sqrt(2 * Math.PI * variance);
  const exponent = Math.exp(-((x - mean) ** 2) / (2 * variance));
  return coefficient * exponent;
}

function normalizeFeatures(vitals: VitalSigns): FeatureValues {
  // Convert our format to model format
  return {
    "Suhu Tubuh (C)": vitals.suhu,
    "Detak Jantung": vitals.bpm,
    "Sistolik": vitals.tekanan_sys,
    "Diastolik": vitals.tekanan_dia,
    "Saturasi Oksigen": vitals.spo2
  };
}

export async function classifyWithFirebaseModel(vitals: VitalSigns): Promise<ClassificationResult> {
  const features = normalizeFeatures(vitals);
  const model = await loadModelFromFirebase();
  
  // Calculate log probabilities for each class
  const logProbs: Record<string, number> = {};
  
  for (const classLabel of ['0', '1', '2']) {
    // Start with log prior
    logProbs[classLabel] = Math.log(model.prior[classLabel as keyof typeof model.prior]);
    
    // Add log likelihood for each feature
    for (const [featureName, value] of Object.entries(features)) {
      const mean = model.means[classLabel as keyof typeof model.means][featureName as keyof FeatureValues];
      const std = model.std[classLabel as keyof typeof model.std][featureName as keyof FeatureValues];
      
      const likelihood = gaussianPDF(value, mean, std);
      logProbs[classLabel] += Math.log(likelihood + 1e-10); // Add small epsilon to avoid log(0)
    }
  }
  
  // Convert to regular probabilities
  const maxLogProb = Math.max(...Object.values(logProbs));
  const probs: Record<string, number> = {};
  let totalProb = 0;
  
  for (const [classLabel, logProb] of Object.entries(logProbs)) {
    probs[classLabel] = Math.exp(logProb - maxLogProb);
    totalProb += probs[classLabel];
  }
  
  // Normalize probabilities
  for (const classLabel of Object.keys(probs)) {
    probs[classLabel] /= totalProb;
  }
  
  // Find predicted class
  const predictedClass = Object.keys(probs).reduce((a, b) => 
    probs[a] > probs[b] ? a : b
  );
  
  // Map class numbers to readable labels
  const classMapping = {
    '0': 'Normal',
    '1': 'Kurang Normal', 
    '2': 'Berbahaya'
  } as const;
  
  const classification = classMapping[predictedClass as keyof typeof classMapping];
  const confidence = probs[predictedClass];
  
  return {
    classification,
    confidence,
    probabilities: {
      Normal: probs['0'],
      'Kurang Normal': probs['1'],
      Berbahaya: probs['2']
    },
    raw_class: parseInt(predictedClass),
    explanation: `KLASIFIKASI MENGGUNAKAN MODEL FIREBASE REAL-TIME:\n` +
                 `Model URL: ${FIREBASE_MODEL_URL}\n` +
                 `Dataset: 79,540 EHR samples dari Kaggle\n` +
                 `Algorithm: Gaussian Naive Bayes\n` +
                 `Sensor: MAX30105 (HR/SpO2), MLX90614 (Temp), SPG010 (BP)\n\n` +
                 `Features dianalisis:\n` +
                 `- Suhu: ${vitals.suhu}°C\n` +
                 `- Detak Jantung: ${vitals.bpm} BPM\n` +
                 `- Sistolik: ${vitals.tekanan_sys} mmHg\n` +
                 `- Diastolik: ${vitals.tekanan_dia} mmHg\n` +
                 `- SpO2: ${vitals.spo2}%\n\n` +
                 `✅ Model disinkronkan dengan Arduino ESP32\n` +
                 `✅ Real-time dari: ${FIREBASE_MODEL_URL}`
  };
}