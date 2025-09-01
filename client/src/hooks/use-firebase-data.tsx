import { useState, useEffect, useCallback } from 'react';
import { subscribeToHeartData, getHistoricalData, subscribeToNewData } from '@/lib/firebase';
import type { HeartDataWithId } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

export interface UseFirebaseDataReturn {
  currentData: HeartDataWithId | null;
  historicalData: HeartDataWithId[];
  isConnected: boolean;
  lastUpdate: Date | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export const useFirebaseData = (): UseFirebaseDataReturn => {
  const [currentData, setCurrentData] = useState<HeartDataWithId | null>(null);
  const [historicalData, setHistoricalData] = useState<HeartDataWithId[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load historical data
  const loadHistoricalData = useCallback(async () => {
    try {
      const data = await getHistoricalData(50); // Last 50 records
      setHistoricalData(data);
    } catch (err) {
      console.error('Error loading historical data:', err);
      setError('Failed to load historical data');
    }
  }, []);

  // Refresh function
  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    loadHistoricalData();
  }, [loadHistoricalData]);

  useEffect(() => {
    let currentDataUnsubscribe: (() => void) | null = null;
    let newDataUnsubscribe: (() => void) | null = null;

    // Subscribe to current data
    currentDataUnsubscribe = subscribeToHeartData(
      (data) => {
        setCurrentData(data);
        setIsConnected(true);
        setLastUpdate(new Date());
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setIsConnected(false);
        setLoading(false);
      }
    );

    // Subscribe to new data for alerts
    newDataUnsubscribe = subscribeToNewData(
      (data) => {
        // Add to historical data
        setHistoricalData(prev => [data, ...prev.slice(0, 49)]);
        
        // Check for dangerous conditions and show alerts
        if (data.kondisi === 'Berbahaya') {
          toast({
            title: "⚠️ Critical Alert",
            description: "Heart condition detected as 'Berbahaya'. Immediate attention required.",
            variant: "destructive"
          });
          
          // Browser notification if permissions granted
          if (Notification.permission === 'granted') {
            new Notification('Critical Heart Alert', {
              body: 'Heart condition requires immediate attention',
              icon: '/favicon.ico'
            });
          }
        } else if (data.kondisi === 'Kurang Normal') {
          toast({
            title: "⚡ Warning",
            description: "Heart condition detected as 'Kurang Normal'. Monitor closely.",
            variant: "default"
          });
        }
      },
      (err) => {
        console.error('New data subscription error:', err);
      }
    );

    // Load initial historical data
    loadHistoricalData();

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      if (currentDataUnsubscribe) currentDataUnsubscribe();
      if (newDataUnsubscribe) newDataUnsubscribe();
    };
  }, [loadHistoricalData, toast]);

  return {
    currentData,
    historicalData,
    isConnected,
    lastUpdate,
    loading,
    error,
    refresh
  };
};
