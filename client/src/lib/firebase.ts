import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, onValue, off, child, get } from 'firebase/database';
import type { HeartData, HeartDataWithId } from '@shared/schema';

// Firebase configuration - using ESP32 Arduino database
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB56eLVWtBYt6EN3-grFMvoW3mY2zV6Q-I",
  authDomain: "heart-monitoring-20872.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://heart-monitoring-20872-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "heart-monitoring-20872",
  storageBucket: "heart-monitoring-20872.appspot.com",
  messagingSenderId: "123456789", 
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase (prevent duplicate app initialization)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
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
  // Convert Arduino timestamp to proper JavaScript timestamp
  let timestamp: number;
  
  // Check if we have waktu_baca (formatted datetime from Arduino)
  if (arduinoData.waktu_baca) {
    try {
      // Parse the formatted datetime string (e.g., "2025-09-19 16:52:10")
      const parsedDate = new Date(arduinoData.waktu_baca.replace(' ', 'T') + '+07:00'); // Add timezone
      timestamp = parsedDate.getTime();
      console.log(`📅 Using Arduino waktu_baca: ${arduinoData.waktu_baca} -> ${timestamp}`);
    } catch (error) {
      console.warn('Failed to parse waktu_baca, using fallback');
      timestamp = Date.now();
    }
  } else if (arduinoData.waktu > 1000000000000) {
    // Already a proper timestamp in milliseconds (13 digits)
    timestamp = arduinoData.waktu;
    console.log(`⏰ Using Arduino timestamp (ms): ${timestamp}`);
  } else if (arduinoData.waktu > 1000000000) {
    // Unix epoch seconds (10 digits) - convert to milliseconds
    timestamp = arduinoData.waktu * 1000;
    console.log(`⏰ Using Arduino timestamp (s): ${arduinoData.waktu} -> ${timestamp}`);
  } else {
    // Arduino millis() since boot - use current time as approximation
    timestamp = Date.now();
    console.log(`⏰ Arduino millis() detected, using current time: ${timestamp}`);
  }
  
  // ✅ LOG PREDIKSI FIREBASE MODEL jika ada
  if (arduinoData.prediksi_nb) {
    console.log(`🧠 Arduino Firebase Model Prediction: ${arduinoData.prediksi_nb}`);
    console.log(`🤖 Arduino Hardware Classification: ${arduinoData.status_kesehatan}`);
  }
  
  const transformedData = {
    id,
    timestamp,
    suhu: parseFloat(arduinoData.suhu_tubuh) || 36.5,
    bpm: parseInt(arduinoData.detak_jantung) || 75,
    spo2: parseInt(arduinoData.kadar_oksigen) || 98,
    tekanan_sys: parseInt(arduinoData.tekanan_sistolik) || 120,
    tekanan_dia: parseInt(arduinoData.tekanan_diastolik) || 80,
    signal_quality: 85, // Default quality since Arduino doesn't send this
    // Use Arduino classification directly
    kondisi: arduinoData.status_kesehatan || 'Normal'
  };
  
  console.log(`🔄 Transformed Arduino data:`, {
    original: {
      waktu: arduinoData.waktu,
      waktu_baca: arduinoData.waktu_baca,
      perangkat: arduinoData.perangkat
    },
    transformed: {
      timestamp: transformedData.timestamp,
      formattedTime: new Date(transformedData.timestamp).toLocaleString('id-ID')
    }
  });
  
  return transformedData;
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

// Get historical data (Arduino format) - Enhanced for persistent storage
export const getHistoricalData = async (
  limit: number = 100
): Promise<HeartDataWithId[]> => {
  try {
    const allData: HeartDataWithId[] = [];
    
    // 1. Get current/latest data from data_kesehatan/terbaru
    const latestRef = ref(database, 'data_kesehatan/terbaru');
    const latestSnapshot = await get(latestRef);
    
    if (latestSnapshot.exists()) {
      const latestArduinoData = latestSnapshot.val() as ArduinoData;
      const transformedLatest = transformArduinoData(latestArduinoData, 'latest-' + latestArduinoData.waktu);
      allData.push(transformedLatest);
      console.log('✅ Latest data from Arduino:', transformedLatest);
    }
    
    // 2. Get historical entries from data_kesehatan/history (if exists)
    const historyRef = ref(database, 'data_kesehatan/history');
    const historySnapshot = await get(historyRef);
    
    if (historySnapshot.exists()) {
      const historyData = historySnapshot.val();
      const historyEntries = Object.entries(historyData)
        .map(([key, value]: [string, any]) => {
          if (value.suhu_tubuh !== undefined) {
            return transformArduinoData(value as ArduinoData, key);
          }
          return null;
        })
        .filter(Boolean) as HeartDataWithId[];
      
      allData.push(...historyEntries);
      console.log(`✅ ${historyEntries.length} historical records loaded`);
    }
    
    // 3. Get additional entries from main data_kesehatan (excluding terbaru and history)
    const mainRef = ref(database, 'data_kesehatan');
    const mainSnapshot = await get(mainRef);
    
    if (mainSnapshot.exists()) {
      const mainData = mainSnapshot.val();
      const mainEntries = Object.entries(mainData)
        .filter(([key]) => key !== 'terbaru' && key !== 'history') // Skip special keys
        .map(([key, value]: [string, any]) => {
          if (value && typeof value === 'object' && value.suhu_tubuh !== undefined) {
            return transformArduinoData(value as ArduinoData, key);
          }
          return null;
        })
        .filter(Boolean) as HeartDataWithId[];
      
      allData.push(...mainEntries);
      console.log(`✅ ${mainEntries.length} additional records from main path`);
    }
    
    // 4. Remove duplicates and sort by timestamp (newest first)
    const uniqueData = allData.reduce((acc, current) => {
      const exists = acc.find(item => Math.abs(item.timestamp - current.timestamp) < 5000); // 5 seconds tolerance
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, [] as HeartDataWithId[]);
    
    const sortedData = uniqueData
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
    
    console.log(`✅ Total unique historical data points: ${sortedData.length}`);
    return sortedData;
    
  } catch (error) {
    console.error('❌ Error fetching historical data:', error);
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
