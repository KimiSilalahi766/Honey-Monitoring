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

// Real-time data listener
export const subscribeToHeartData = (
  callback: (data: HeartDataWithId | null) => void,
  onError?: (error: Error) => void
) => {
  const dataRef = ref(database, 'data_jantung');
  
  const unsubscribe = onValue(
    dataRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        // Get the most recent entry
        const keys = Object.keys(data).sort().reverse();
        const latestKey = keys[0];
        
        if (latestKey && data[latestKey]) {
          const latestData: HeartDataWithId = {
            id: latestKey,
            ...data[latestKey]
          };
          callback(latestData);
        } else {
          callback(null);
        }
      } else {
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

// Get historical data
export const getHistoricalData = async (
  limit: number = 100
): Promise<HeartDataWithId[]> => {
  try {
    const dataRef = ref(database, 'data_jantung');
    const snapshot = await get(dataRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      const entries = Object.entries(data)
        .map(([key, value]: [string, any]) => ({
          id: key,
          ...value
        }))
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
      
      return entries as HeartDataWithId[];
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return [];
  }
};

// Listen for new data entries
export const subscribeToNewData = (
  callback: (data: HeartDataWithId) => void,
  onError?: (error: Error) => void
) => {
  const dataRef = ref(database, 'data_jantung');
  
  let isInitialLoad = true;
  
  const unsubscribe = onValue(
    dataRef,
    (snapshot) => {
      if (isInitialLoad) {
        isInitialLoad = false;
        return;
      }
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const keys = Object.keys(data).sort().reverse();
        const latestKey = keys[0];
        
        if (latestKey && data[latestKey]) {
          const newData: HeartDataWithId = {
            id: latestKey,
            ...data[latestKey]
          };
          callback(newData);
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
