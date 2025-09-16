import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Thermometer, 
  Heart, 
  Activity, 
  Droplets,
  Wifi,
  WifiOff,
  RefreshCw,
  Brain,
  BarChart3,
  TestTube
} from "lucide-react";
import { Link } from "wouter";
import { SimpleCharts } from "@/components/simple-charts";
import { NotificationSystem, useNotifications } from "@/components/notification-system";
import { useFirebaseData } from "@/hooks/use-firebase-data";
import { classifyWithFirebaseModel } from "@/lib/naive-bayes-firebase-model";
import { database } from "@/lib/firebase";
import { ref } from "firebase/database";
import { useState } from 'react';

// 🧹 PANDUAN MEMBERSIHKAN FIREBASE REALTIME DATABASE:
// 1. Buka: https://console.firebase.google.com/project/monitoring-jantung-f8031/database/monitoring-jantung-f8031-default-rtdb/data
// 2. Login dengan akun Google yang memiliki akses ke project
// 3. Navigate ke path: /data_kesehatan/
// 4. Hapus data lama: Click pada data lama → Delete
// 5. Untuk mass delete: Select multiple entries → Delete
// 6. Keep only recent/relevant data untuk testing
// 
// STRUKTUR DATA YANG BENAR:
// /data_kesehatan/terbaru/ - Data terbaru dari ESP32 Arduino
// Format: { waktu: number, perangkat: string, suhu_tubuh: number, ... }

export default function Dashboard() {
  const { 
    currentData, 
    historicalData, 
    isConnected, 
    lastUpdate, 
    loading, 
    error,
    refresh 
  } = useFirebaseData();
  
  const { notifications, addNotification, removeNotification } = useNotifications();
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Safe notifications - only trigger on condition changes
  const lastCondition = useRef<string | null>(null);
  
  useEffect(() => {
    if (currentData && currentData.kondisi && currentData.kondisi !== lastCondition.current) {
      lastCondition.current = currentData.kondisi;
      
      if (currentData.kondisi === 'Berbahaya') {
        addNotification(
          'danger',
          'Peringatan Kritis',
          'Kondisi jantung berbahaya terdeteksi!'
        );
      }
    }
  }, [currentData?.kondisi, addNotification]);

  // Removed test data function - system detects Arduino data automatically

  // ✅ MENGGUNAKAN MODEL FIREBASE YANG DIUPLOAD USER (ASYNC)
  const [enhancedClassification, setEnhancedClassification] = useState<any>(null);
  const [classificationLoading, setClassificationLoading] = useState(false);
  
  
  useEffect(() => {
    if (!currentData) {
      setEnhancedClassification(null);
      return;
    }
    
    const runClassification = async () => {
      setClassificationLoading(true);
      try {
        // GUNAKAN MODEL NAIVE BAYES DARI FIREBASE URL
        const result = await classifyWithFirebaseModel({
          suhu: currentData.suhu,
          bpm: currentData.bpm,
          spo2: currentData.spo2,
          tekanan_sys: currentData.tekanan_sys,
          tekanan_dia: currentData.tekanan_dia
        });
        
        setEnhancedClassification({
          classification: result.classification,
          confidence: result.confidence,
          probabilities: result.probabilities,
          explanation: result.explanation,
          features_impact: {
            suhu: currentData.suhu > 37.5 ? 0.8 : 0.2,
            bpm: currentData.bpm > 100 || currentData.bpm < 60 ? 0.8 : 0.2,
            spo2: currentData.spo2 < 95 ? 0.8 : 0.2,
            tekanan_sys: currentData.tekanan_sys > 140 ? 0.8 : 0.2,
            tekanan_dia: currentData.tekanan_dia > 90 ? 0.8 : 0.2,
            signal_quality: currentData.signal_quality < 80 ? 0.5 : 0.1
          }
        });
      } catch (err) {
        console.error('Firebase model classification error:', err);
        setEnhancedClassification(null);
      } finally {
        setClassificationLoading(false);
      }
    };
    
    runClassification();
  }, [currentData]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Card className="glass-card p-8 rounded-2xl">
          <CardContent className="flex items-center space-x-3">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <span className="text-lg font-medium">Memuat sistem monitoring...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4">
        
        {/* Header - Simplified */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Monitoring Jantung IoT
              </h1>
              <p className="text-muted-foreground">
                Real-time dengan Naive Bayes AI
              </p>
            </div>
            
            {/* Connection Status */}
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {isConnected ? (
                      <>
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-ping absolute" />
                        <div className="w-3 h-3 bg-green-400 rounded-full relative" />
                      </>
                    ) : (
                      <div className="w-3 h-3 bg-red-400 rounded-full" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {isConnected ? 'Terhubung' : 'Terputus'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {lastUpdate 
                        ? `${Math.floor((Date.now() - lastUpdate.getTime()) / 1000)}s lalu`
                        : 'Menunggu data...'
                      }
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={refresh}
                    disabled={loading}
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {error && (
          <Card className="mb-6 border-destructive/50 bg-destructive/10">
            <CardContent className="p-4">
              <p className="text-destructive font-medium">Error: {error}</p>
            </CardContent>
          </Card>
        )}

        {/* Firebase Test & Results - Clear Display */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Firebase Status & Test */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Wifi className="w-5 h-5 mr-2 text-green-400" />
                Status Firebase ESP32
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Koneksi Database</span>
                  <Badge variant={isConnected ? "default" : "destructive"}>
                    {isConnected ? "AKTIF" : "PUTUS"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Data Masuk</span>
                  <span className="text-sm font-mono">
                    {historicalData.length} record
                  </span>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    ✅ Monitoring Aktif
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                    Data ESP32 Arduino otomatis tampil
                  </p>
                  <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-800">
                    <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
                      <p className="font-medium">🤖 ML: Naive Bayes (Google Colab)</p>
                      <p>📊 Dataset: 79,540 Kaggle EHR samples</p>
                      <div className="flex gap-2 justify-center mt-1">
                        <a href="https://www.kaggle.com/datasets/hansaniuma/patient-health-scores-for-ehr-data" 
                           target="_blank" rel="noopener" 
                           className="text-blue-600 dark:text-blue-400 hover:underline">Kaggle</a>
                        <span>•</span>
                        <a href="https://colab.research.google.com/drive/1vcbUR3Tjy6dU9Krr9FEEFH_JX4hNcb-g?usp=sharing" 
                           target="_blank" rel="noopener" 
                           className="text-blue-600 dark:text-blue-400 hover:underline">Colab</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Naive Bayes Results */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Brain className="w-5 h-5 mr-2 text-primary" />
                Hasil Naive Bayes AI
              </CardTitle>
            </CardHeader>
            <CardContent>
              {classificationLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
                  <p>Memuat klasifikasi Firebase...</p>
                </div>
              ) : enhancedClassification && currentData ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center text-xl font-bold ${
                      enhancedClassification.classification === 'Normal' 
                        ? "bg-green-400/20 text-green-400" 
                        : enhancedClassification.classification === 'Kurang Normal'
                        ? "bg-yellow-400/20 text-yellow-400"
                        : "bg-red-400/20 text-red-400"
                    }`}>
                      {enhancedClassification.classification === 'Normal' ? '✓' : '⚠'}
                    </div>
                    <h3 className="font-bold mb-1">{enhancedClassification.classification}</h3>
                    <p className="text-sm text-muted-foreground">
                      Akurasi: {(enhancedClassification.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {Object.entries(enhancedClassification.probabilities).map(([label, prob]) => (
                      <div key={label} className="text-center">
                        <div className="font-mono font-bold">
                          {((prob as number) * 100).toFixed(0)}%
                        </div>
                        <div className="text-muted-foreground truncate">
                          {label === 'Normal' ? 'Normal' : 
                           label === 'Kurang Normal' ? 'Kurang' : 'Bahaya'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Menunggu data untuk klasifikasi...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ✅ PERBANDINGAN PREDIKSI: Arduino vs Web Model */}
          <Card className="glass-card border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Brain className="w-5 h-5 mr-2 text-primary" />
                Perbandingan Model Klasifikasi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Web Model Firebase (Yang User Upload) */}
                <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                  <div className="flex items-center mb-3">
                    <Brain className="w-5 h-5 mr-2 text-primary" />
                    <h4 className="font-semibold">Web Model Firebase</h4>
                  </div>
                  {enhancedClassification ? (
                    <div className="space-y-2">
                      <div className={`text-center py-2 px-3 rounded font-bold ${
                        enhancedClassification.classification === 'Normal' 
                          ? "bg-green-500/20 text-green-400" 
                          : enhancedClassification.classification === 'Kurang Normal'
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                      }`}>
                        {enhancedClassification.classification}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <div>Confidence: {(enhancedClassification.confidence * 100).toFixed(1)}%</div>
                        <div>Source: Firebase Real-time</div>
                        <div>Sensor: SPG010, MAX30102, MLX90614</div>
                        <div>Dataset: 79,540 samples EHR</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      Menunggu data...
                    </div>
                  )}
                </div>

                {/* Arduino Hardware Classification */}
                <div className="p-4 rounded-lg border border-orange-500/20 bg-orange-500/5">
                  <div className="flex items-center mb-3">
                    <Activity className="w-5 h-5 mr-2 text-orange-500" />
                    <h4 className="font-semibold">Arduino Hardware</h4>
                  </div>
                  {currentData ? (
                    <div className="space-y-2">
                      <div className={`text-center py-2 px-3 rounded font-bold ${
                        currentData.kondisi === 'Normal' 
                          ? "bg-green-500/20 text-green-400" 
                          : currentData.kondisi === 'Kurang Normal'
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                      }`}>
                        {currentData.kondisi}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <div>Source: ESP32 Scoring Algorithm</div>
                        <div>Method: Rule-based threshold</div>
                        <div>Real-time: Sensor langsung</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      Tidak ada data Arduino
                    </div>
                  )}
                </div>
              </div>
              
              {/* Explanation */}
              <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  💡 <strong>Perbedaan:</strong> Web Model menggunakan machine learning dengan 79,540 data pasien EHR, 
                  sedangkan Arduino menggunakan algoritma scoring berbasis threshold medis. 
                  Kedua metode dapat memberikan hasil yang berbeda karena pendekatan yang berbeda.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Vital Signs - Compact */}
        {currentData && (
          <div className="space-y-6 mb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Temperature */}
              <Card className="glass-card bg-gradient-to-br from-red-400/10 to-orange-400/10">
                <CardContent className="p-4 text-center">
                  <Thermometer className="w-6 h-6 mx-auto mb-2 text-red-400" />
                  <div className="text-2xl font-bold text-red-400">
                    {currentData.suhu}°C
                  </div>
                  <div className="text-xs text-muted-foreground">Suhu Tubuh</div>
                </CardContent>
              </Card>

              {/* Heart Rate */}
              <Card className="glass-card bg-gradient-to-br from-red-500/10 to-pink-500/10">
                <CardContent className="p-4 text-center">
                  <Heart className="w-6 h-6 mx-auto mb-2 text-red-500" fill="currentColor" />
                  <div className="text-2xl font-bold text-red-500">
                    {currentData.bpm}
                  </div>
                  <div className="text-xs text-muted-foreground">Denyut Jantung</div>
                </CardContent>
              </Card>

              {/* SpO2 */}
              <Card className="glass-card bg-gradient-to-br from-blue-400/10 to-cyan-400/10">
                <CardContent className="p-4 text-center">
                  <Droplets className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                  <div className="text-2xl font-bold text-blue-400">
                    {currentData.spo2}%
                  </div>
                  <div className="text-xs text-muted-foreground">Oksigen Darah</div>
                </CardContent>
              </Card>

              {/* Blood Pressure */}
              <Card className="glass-card bg-gradient-to-br from-purple-400/10 to-indigo-400/10">
                <CardContent className="p-4 text-center">
                  <Activity className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                  <div className="text-lg font-bold text-purple-400">
                    {currentData.tekanan_sys}/{currentData.tekanan_dia}
                  </div>
                  <div className="text-xs text-muted-foreground">Tekanan Darah</div>
                </CardContent>
              </Card>
            </div>
            
            {/* Penjelasan Parameter */}
            <Card className="glass-card bg-muted/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-muted-foreground" />
                  Penjelasan Parameter Vital
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-red-400 flex items-center">
                      <Thermometer className="w-4 h-4 mr-1" />
                      Suhu Tubuh
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <strong>Normal:</strong> 36.1-37.2°C<br/>
                      Mengukur suhu internal tubuh untuk mendeteksi demam atau hipotermia.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-red-500 flex items-center">
                      <Heart className="w-4 h-4 mr-1" fill="currentColor" />
                      BPM (Beats Per Minute)
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <strong>Normal:</strong> 60-100 BPM<br/>
                      Jumlah detak jantung per menit. Menunjukkan irama dan kekuatan jantung.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-blue-400 flex items-center">
                      <Droplets className="w-4 h-4 mr-1" />
                      SpO2 (Saturasi Oksigen)
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <strong>Normal:</strong> 95-100%<br/>
                      Persentase oksigen dalam darah. Penting untuk fungsi organ vital.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-purple-400 flex items-center">
                      <Activity className="w-4 h-4 mr-1" />
                      Tekanan Darah (mmHg)
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <strong>Normal:</strong> 90-120/60-80<br/>
                      Tekanan darah menunjukkan kekuatan aliran darah dalam pembuluh arteri.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Charts */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-primary" />
            Grafik Real-time
          </h2>
          <SimpleCharts 
            data={historicalData} 
            currentData={currentData}
          />
          
          {/* Informasi Grafik */}
          <Card className="glass-card mt-4 bg-muted/20">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2 text-primary">📈 Cara Membaca Grafik</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Grafik menampilkan perubahan vital signs dalam waktu nyata. 
                    Garis merah = BPM, Garis biru = SpO2, Garis oranye = Suhu.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-green-600">✅ Rentang Normal</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Suhu: 36.1-37.2°C | BPM: 60-100 | SpO2: 95-100% | 
                    Tekanan: 90-120/60-80 mmHg
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-yellow-600">⚠️ Peringatan</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Jika nilai di luar rentang normal secara konsisten, 
                    segera konsultasi dengan tenaga medis.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Historical Data - Simplified */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Data Terakhir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {historicalData.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Belum ada data. Kirim test data atau hubungkan ESP32.
                </p>
              ) : (
                historicalData.slice(0, 5).map((item, index) => (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-background/50 rounded-lg"
                  >
                    <div>
                      <p className="font-mono text-sm">
                        {new Date(item.timestamp).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Suhu: {item.suhu}°C • Jantung: {item.bpm}BPM • Oksigen: {item.spo2}% • Tekanan: {item.tekanan_sys}/{item.tekanan_dia} mmHg
                      </p>
                    </div>
                    <Badge 
                      variant={
                        item.kondisi === 'Normal' ? 'default' :
                        item.kondisi === 'Kurang Normal' ? 'secondary' : 'destructive'
                      }
                      className="text-xs"
                    >
                      {item.kondisi}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notification System */}
      <NotificationSystem 
        notifications={notifications}
        onClose={removeNotification}
      />

      {/* Back to Home */}
      <Link href="/">
        <Button
          className="fixed bottom-6 left-6 w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-full shadow-xl z-40"
        >
          <Home className="w-6 h-6 text-white" />
        </Button>
      </Link>
    </div>
  );
}