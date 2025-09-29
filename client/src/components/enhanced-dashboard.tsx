import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  Heart, 
  Activity, 
  Thermometer,
  Droplets,
  BarChart3,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFirebaseData } from "@/hooks/use-firebase-data";
import { classifyHeartCondition, calculateFeatureImportance } from "@/lib/naive-bayes";
import { RealTimeChart } from "@/components/real-time-chart";

interface EnhancedDashboardProps {
  className?: string;
}

export function EnhancedDashboard({ className }: EnhancedDashboardProps) {
  const firebaseData = useFirebaseData();
  
  // Use Firebase data only (simplified for thesis project)
  const currentData = firebaseData.currentData;
  const historicalData = firebaseData.historicalData;
  const isLoading = firebaseData.loading;
  const isConnected = firebaseData.isConnected;

  // Enhanced classification with feature importance
  const [enhancedAnalysis, setEnhancedAnalysis] = useState<any>(null);
  
  useEffect(() => {
    if (currentData) {
      const performAnalysis = async () => {
        try {
          console.log('🔬 Performing enhanced analysis with new trained model...');
          
          const classification = await classifyHeartCondition({
            suhu: currentData.suhu,
            bpm: currentData.bpm,
            spo2: currentData.spo2,
            tekanan_sys: currentData.tekanan_sys,
            tekanan_dia: currentData.tekanan_dia,
            signal_quality: currentData.signal_quality
          });
          
          const featureImportance = calculateFeatureImportance({
            suhu: currentData.suhu,
            bpm: currentData.bpm,
            spo2: currentData.spo2,
            tekanan_sys: currentData.tekanan_sys,
            tekanan_dia: currentData.tekanan_dia,
            signal_quality: currentData.signal_quality
          });
          
          console.log('📊 Analysis completed:', { classification, featureImportance });
          setEnhancedAnalysis({ classification, featureImportance });
        } catch (error) {
          console.error('❌ Analysis error:', error);
        }
      };
      
      performAnalysis();
    }
  }, [currentData]);

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-12", className)}>
        <Card className="glass-card bg-card/40 backdrop-blur-lg p-8">
          <CardContent className="flex items-center space-x-3">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <span className="text-lg font-medium">Memuat data monitoring...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Connection Status */}
      <Card className="glass-card bg-card/40 backdrop-blur-lg border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Status Koneksi Firebase</h3>
            <div className="flex items-center space-x-2">
              <div className={cn(
                "w-3 h-3 rounded-full",
                isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"
              )} />
              <span className="text-sm text-muted-foreground">
                {isConnected ? "Terhubung" : "Terputus"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Parameters Grid */}
      {currentData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Temperature */}
          <Card className="glass-card bg-gradient-to-br from-red-400/10 to-orange-400/10 backdrop-blur-lg border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-red-400/20 to-orange-400/20 rounded-xl">
                  <Thermometer className="w-6 h-6 text-red-400" />
                </div>
                <Badge 
                  variant={currentData.suhu >= 36.1 && currentData.suhu <= 37.2 ? "default" : "destructive"}
                >
                  {currentData.suhu >= 36.1 && currentData.suhu <= 37.2 ? "Normal" : "Abnormal"}
                </Badge>
              </div>
              <div>
                <p className="text-3xl font-bold">{currentData.suhu.toFixed(1)}°C</p>
                <p className="text-sm text-muted-foreground">Suhu Tubuh</p>
                <p className="text-xs text-muted-foreground mt-1">Normal: 36.1-37.2°C</p>
              </div>
            </CardContent>
          </Card>

          {/* Heart Rate */}
          <Card className="glass-card bg-gradient-to-br from-red-500/10 to-pink-500/10 backdrop-blur-lg border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-xl">
                  <Heart className="w-6 h-6 text-red-500" fill="currentColor" />
                </div>
                <Badge 
                  variant={currentData.bpm >= 60 && currentData.bpm <= 100 ? "default" : "destructive"}
                >
                  {currentData.bpm >= 60 && currentData.bpm <= 100 ? "Normal" : "Abnormal"}
                </Badge>
              </div>
              <div>
                <p className="text-3xl font-bold">{currentData.bpm}</p>
                <p className="text-sm text-muted-foreground">Detak Jantung (BPM)</p>
                <p className="text-xs text-muted-foreground mt-1">Normal: 60-100 BPM</p>
              </div>
            </CardContent>
          </Card>

          {/* SpO2 */}
          <Card className="glass-card bg-gradient-to-br from-blue-400/10 to-cyan-400/10 backdrop-blur-lg border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-xl">
                  <Droplets className="w-6 h-6 text-blue-400" />
                </div>
                <Badge 
                  variant={currentData.spo2 >= 95 ? "default" : "destructive"}
                >
                  {currentData.spo2 >= 95 ? "Normal" : "Rendah"}
                </Badge>
              </div>
              <div>
                <p className="text-3xl font-bold">{currentData.spo2}%</p>
                <p className="text-sm text-muted-foreground">Kadar Oksigen (SpO2)</p>
                <p className="text-xs text-muted-foreground mt-1">Normal: ≥95%</p>
              </div>
            </CardContent>
          </Card>

          {/* Blood Pressure */}
          <Card className="glass-card bg-gradient-to-br from-purple-400/10 to-indigo-400/10 backdrop-blur-lg border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-400/20 to-indigo-400/20 rounded-xl">
                  <Activity className="w-6 h-6 text-purple-400" />
                </div>
                <Badge 
                  variant={(
                    currentData.tekanan_sys >= 90 && currentData.tekanan_sys <= 120 &&
                    currentData.tekanan_dia >= 60 && currentData.tekanan_dia <= 80
                  ) ? "default" : "destructive"}
                >
                  {(
                    currentData.tekanan_sys >= 90 && currentData.tekanan_sys <= 120 &&
                    currentData.tekanan_dia >= 60 && currentData.tekanan_dia <= 80
                  ) ? "Normal" : "Abnormal"}
                </Badge>
              </div>
              <div>
                <p className="text-3xl font-bold">{currentData.tekanan_sys}/{currentData.tekanan_dia}</p>
                <p className="text-sm text-muted-foreground">Tekanan Darah (mmHg)</p>
                <p className="text-xs text-muted-foreground mt-1">Normal: 90-120/60-80</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Naive Bayes Analysis */}
      {enhancedAnalysis && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Classification Result */}
          <Card className="glass-card bg-gradient-to-br from-primary/5 to-accent/5 backdrop-blur-lg border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Brain className="w-5 h-5 mr-2 text-primary" />
                Hasil Klasifikasi Naive Bayes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className={cn(
                    "w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl font-bold",
                    enhancedAnalysis.classification.classification === 'Normal' 
                      ? "bg-green-400/20 text-green-400" 
                      : enhancedAnalysis.classification.classification === 'Kurang Normal'
                      ? "bg-yellow-400/20 text-yellow-400"
                      : "bg-red-400/20 text-red-400"
                  )}>
                    {enhancedAnalysis.classification.classification === 'Normal' ? '✓' :
                     enhancedAnalysis.classification.classification === 'Kurang Normal' ? '⚠' : '⚠'}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{enhancedAnalysis.classification.classification}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Confidence: {(enhancedAnalysis.classification.confidence * 100).toFixed(1)}%
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">Probabilitas Kelas:</h4>
                  {Object.entries(enhancedAnalysis.classification.probabilities).map(([label, prob]) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-sm">{label}</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={(prob as number) * 100} className="w-20 h-2" />
                        <span className="text-sm font-mono w-12">
                          {((prob as number) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature Importance */}
          <Card className="glass-card bg-card/40 backdrop-blur-lg border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <BarChart3 className="w-5 h-5 mr-2 text-accent" />
                Kontribusi Parameter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Seberapa besar pengaruh setiap parameter dalam keputusan klasifikasi:
                </p>
                
                {enhancedAnalysis.featureImportance && enhancedAnalysis.featureImportance.map((item: any, index: number) => (
                  <div key={item.feature} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={index === 0 ? "default" : "secondary"}
                        className="w-6 h-6 text-xs flex items-center justify-center p-0"
                      >
                        {index + 1}
                      </Badge>
                      <div>
                        <span className="font-medium text-sm">{item.feature}</span>
                        <p className="text-xs text-muted-foreground">Nilai: {item.value}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Progress 
                        value={item.impact} 
                        className="w-16 h-2"
                      />
                      <span className="text-sm font-mono w-12">
                        {item.impact.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
                
                <div className="mt-4 pt-4 border-t border-border/30">
                  <p className="text-xs text-muted-foreground">
                    Parameter dengan kontribusi tinggi memberikan pengaruh besar dalam klasifikasi
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Real-time Chart */}
      <RealTimeChart 
        data={historicalData} 
        currentData={currentData}
        className="mb-6"
      />
    </div>
  );
}