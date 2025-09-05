import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { HeartMonitoringData, InsertHeartMonitoringData } from '@shared/schema';

// Get historical data from database
export function useHeartData() {
  return useQuery({
    queryKey: ['/api/heart-data'],
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000 // Consider data stale after 10 seconds
  });
}

// Get analytics data
export function useAnalytics() {
  return useQuery({
    queryKey: ['/api/analytics'],
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000
  });
}

// Store new heart data
export function useStoreHeartData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InsertHeartMonitoringData) => {
      const response = await fetch('/api/heart-data', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch both heart data and analytics
      queryClient.invalidateQueries({ queryKey: ['/api/heart-data'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
    }
  });
}

// Combine Firebase real-time data with database historical data
export function useCombinedHeartData() {
  const { data: dbData, isLoading: dbLoading, error: dbError } = useHeartData();
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics();
  
  // Transform database data to match Firebase format
  const transformedData = (dbData as any)?.success ? (dbData as any).data.map((item: any) => ({
    id: item.id.toString(),
    timestamp: new Date(item.created_at).getTime(),
    suhu: parseFloat(item.suhu.toString()),
    bpm: parseInt(item.bpm.toString()),
    spo2: parseInt(item.spo2.toString()),
    tekanan_sys: parseInt(item.tekanan_sys.toString()),
    tekanan_dia: parseInt(item.tekanan_dia.toString()),
    signal_quality: parseInt(item.signal_quality.toString()),
    kondisi: item.nb_classification || item.kondisi,
    nb_classification: item.nb_classification,
    nb_confidence: item.nb_confidence ? parseFloat(item.nb_confidence.toString()) : null
  })) : [];

  return {
    historicalData: transformedData,
    currentData: transformedData[0] || null, // Most recent data as current
    analytics: (analytics as any)?.success ? (analytics as any).analytics : null,
    isLoading: dbLoading,
    error: dbError
  };
}