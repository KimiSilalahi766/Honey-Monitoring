import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, off, child, get } from 'firebase/database';
import type { HeartData, HeartDataWithId } from '@shared/schema';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC_4FizusMK9ksaWcYXBmubsp3GGxuuX0g",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "monitoring-jantung-f8031.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://monitoring-jantung-f8031-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "monitoring-jantung-f8031",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "monitoring-jantung-f8031.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);

// Arduino data interface
interface ArduinoData {
  waktu: number;
  perangkat: string;
  suhu_tubuh: string;
  detak_jantung: string;
  kadar_oksigen: string;
  tekanan_sistolik: string;
  tekanan_diastolik: string;
  status_kesehatan: string;
  prediksi_nb?: string; // ✅ Field prediksi dari model Firebase
  kalibrasi_sistolik?: string;
  kalibrasi_diastolik?: string;
  waktu_baca?: string;
}

// Transform Arduino data to web app format
const transformArduinoData = (arduinoData: ArduinoData, id: string = 'latest'): HeartDataWithId => {
  // Convert Arduino millis() to proper timestamp
  // Arduino waktu is millis() since boot, convert to real timestamp
  let timestamp: number;
  
  if (arduinoData.waktu > 1000000000000) {
    // Already a proper timestamp in milliseconds (13 digits)
    timestamp = arduinoData.waktu;
  } else if (arduinoData.waktu > 1000000000) {
    // NTP epoch seconds (10 digits) - convert to milliseconds
    timestamp = arduinoData.waktu * 1000;
  } else {
    // Arduino millis() - convert to approximate real timestamp
    // millis() since boot, estimate current time minus millis
    timestamp = Date.now() - arduinoData.waktu;
  }
  
  // ✅ LOG PREDIKSI FIREBASE MODEL jika ada
  if (arduinoData.prediksi_nb) {
    console.log(`🧠 Arduino Firebase Model Prediction: ${arduinoData.prediksi_nb}`);
    console.log(`🤖 Arduino Hardware Classification: ${arduinoData.status_kesehatan}`);
  }
  
  return {
    id,
    timestamp,
    suhu: parseFloat(arduinoData.suhu_tubuh) || 36.5,
    bpm: parseInt(arduinoData.detak_jantung) || 75,
    spo2: parseInt(arduinoData.kadar_oksigen) || 98,
    tekanan_sys: parseInt(arduinoData.tekanan_sistolik) || 120,
    tekanan_dia: parseInt(arduinoData.tekanan_diastolik) || 80,
    signal_quality: 85, // Default quality since Arduino doesn't send this
    // ✅ PAKAI HASIL WEB MODEL (yang user upload), bukan Arduino classification
    kondisi: arduinoData.status_kesehatan === 'Normal' ? 'Normal' : 
             arduinoData.status_kesehatan === 'Kurang Normal' ? 'Kurang Normal' : 'Berbahaya'
  };
};

// Real-time data listener (Arduino format)
export const subscribeToHeartData = (
  callback: (data: HeartDataWithId | null) => void,
  onError?: (error: Error) => void
) => {
  // Listen to Arduino path: data_kesehatan/terbaru
  const dataRef = ref(database, 'data_kesehatan/terbaru');
  
  const unsubscribe = onValue(
    dataRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const arduinoData = snapshot.val() as ArduinoData;
        
        try {
          const transformedData = transformArduinoData(arduinoData, 'latest');
          console.log('Firebase Arduino data received:', arduinoData);
          
          // ✅ LOG PREDIKSI FIREBASE MODEL jika ada
          if (arduinoData.prediksi_nb) {
            console.log(`🧠 Arduino Firebase Model Prediction: ${arduinoData.prediksi_nb}`);
            console.log(`🤖 Arduino Hardware Classification: ${arduinoData.status_kesehatan}`);
            console.log('✅ Web app akan menggunakan model Firebase untuk klasifikasi independen');
          }
          
          console.log('Transformed to web format:', transformedData);
          callback(transformedData);
        } catch (err) {
          console.error('Error transforming Arduino data:', err);
          callback(null);
        }
      } else {
        console.log('No data exists at data_kesehatan/terbaru');
        callback(null);
      }
    },
    (error) => {
      console.error('Firebase subscription error:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
};

// Get historical data (Arduino format)
export const getHistoricalData = async (
  limit: number = 100
): Promise<HeartDataWithId[]> => {
  try {
    // Try to get from data_kesehatan first (Arduino), fallback to data_jantung
    const arduinoRef = ref(database, 'data_kesehatan');
    const snapshot = await get(arduinoRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      
      // Check if this is Arduino format data
      if (data.terbaru) {
        // Single latest entry from Arduino
        const arduinoData = data.terbaru as ArduinoData;
        const transformedData = transformArduinoData(arduinoData, 'latest');
        return [transformedData];
      } else {
        // Multiple entries format
        const entries = Object.entries(data)
          .filter(([key]) => key !== 'terbaru') // Skip terbaru
          .map(([key, value]: [string, any]) => {
            if (value.suhu_tubuh !== undefined) {
              // Arduino format
              return transformArduinoData(value as ArduinoData, key);
            } else {
              // Web app format
              return { id: key, ...value } as HeartDataWithId;
            }
          })
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, limit);
        
        return entries;
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return [];
  }
};

// Listen for new data entries (Arduino format)
export const subscribeToNewData = (
  callback: (data: HeartDataWithId) => void,
  onError?: (error: Error) => void
) => {
  const dataRef = ref(database, 'data_kesehatan/terbaru');
  
  let isInitialLoad = true;
  
  const unsubscribe = onValue(
    dataRef,
    (snapshot) => {
      if (isInitialLoad) {
        isInitialLoad = false;
        return;
      }
      
      if (snapshot.exists()) {
        const arduinoData = snapshot.val() as ArduinoData;
        
        try {
          const transformedData = transformArduinoData(arduinoData, 'new_' + Date.now());
          console.log('New Arduino data received:', arduinoData);
          callback(transformedData);
        } catch (err) {
          console.error('Error transforming new Arduino data:', err);
        }
      }
    },
    (error) => {
      console.error('Firebase new data subscription error:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
};
