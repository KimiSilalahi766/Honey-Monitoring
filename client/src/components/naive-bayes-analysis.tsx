import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  Calculator, 
  BarChart3, 
  TrendingUp, 
  Info, 
  Database,
  Activity,
  Zap,
  ChevronRight,
  Target,
  Layers,
  Code2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  getNaiveBayesAnalysis, 
  calculateFeatureImportance, 
  trainingData,
  classifyHeartCondition 
} from "@/lib/naive-bayes";
import type { ClassificationRequest } from '@shared/schema';

interface NaiveBayesAnalysisProps {
  currentData?: ClassificationRequest | null;
  className?: string;
}

export function NaiveBayesAnalysis({ currentData, className }: NaiveBayesAnalysisProps) {
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [featureImportance, setFeatureImportance] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('Normal');

  useEffect(() => {
    const analysis = getNaiveBayesAnalysis();
    setAnalysisData(analysis);
    
    if (currentData) {
      const importance = calculateFeatureImportance(currentData);
      setFeatureImportance(importance);
    }
  }, [currentData]);

  const classDistribution = analysisData?.class_distributions || {};
  const trainingDataByClass = {
    'Normal': trainingData.filter(d => d.label === 'Normal').length,
    'Kurang Normal': trainingData.filter(d => d.label === 'Kurang Normal').length,
    'Berbahaya': trainingData.filter(d => d.label === 'Berbahaya').length,
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Section */}
      <Card className="glass-card bg-gradient-to-br from-primary/5 to-accent/5 backdrop-blur-lg border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-bold text-foreground">
            <Brain className="w-8 h-8 mr-3 text-primary" />
            Kontribusi Algoritma Naive Bayes
          </CardTitle>
          <p className="text-muted-foreground text-lg">
            Implementasi Machine Learning untuk Identifikasi Dini Kondisi Jantung dalam Penelitian IoT
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-card/40 rounded-xl">
              <Database className="w-8 h-8 mx-auto mb-2 text-accent" />
              <h3 className="font-bold text-xl">{trainingData.length}</h3>
              <p className="text-sm text-muted-foreground">Sampel Training Data</p>
            </div>
            <div className="text-center p-4 bg-card/40 rounded-xl">
              <Target className="w-8 h-8 mx-auto mb-2 text-blue-400" />
              <h3 className="font-bold text-xl">6</h3>
              <p className="text-sm text-muted-foreground">Parameter Vital</p>
            </div>
            <div className="text-center p-4 bg-card/40 rounded-xl">
              <Layers className="w-8 h-8 mx-auto mb-2 text-green-400" />
              <h3 className="font-bold text-xl">3</h3>
              <p className="text-sm text-muted-foreground">Kategori Klasifikasi</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="algorithm">Algoritma</TabsTrigger>
          <TabsTrigger value="training">Training Data</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Kontribusi Naive Bayes */}
            <Card className="glass-card bg-card/40 backdrop-blur-lg border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Zap className="w-5 h-5 mr-2 text-yellow-400" />
                  Kontribusi Utama Naive Bayes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <ChevronRight className="w-4 h-4 text-accent mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Identifikasi Dini Otomatis</h4>
                      <p className="text-sm text-muted-foreground">
                        Algoritma mendeteksi anomali kondisi jantung berdasarkan 6 parameter vital secara real-time
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <ChevronRight className="w-4 h-4 text-accent mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Klasifikasi Probabilistik</h4>
                      <p className="text-sm text-muted-foreground">
                        Memberikan confidence score untuk setiap prediksi (Normal, Kurang Normal, Berbahaya)
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <ChevronRight className="w-4 h-4 text-accent mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Kalibrasi Medis Terintegrasi</h4>
                      <p className="text-sm text-muted-foreground">
                        Training data dikalibrasi dengan standar medis (Tekanan Atas -15mmHg, Tekanan Bawah -10mmHg)
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <ChevronRight className="w-4 h-4 text-accent mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Implementasi Edge Computing</h4>
                      <p className="text-sm text-muted-foreground">
                        Klasifikasi dilakukan di browser (client-side) dan server untuk performa optimal
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Classification */}
            {currentData && (
              <Card className="glass-card bg-card/40 backdrop-blur-lg border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <Activity className="w-5 h-5 mr-2 text-accent" />
                    Analisis Data Saat Ini
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {featureImportance.map((item, index) => (
                      <div key={item.feature} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={index === 0 ? "default" : "secondary"}
                            className="w-6 h-6 text-xs flex items-center justify-center p-0"
                          >
                            {index + 1}
                          </Badge>
                          <span className="font-medium">{item.feature}</span>
                          <span className="text-muted-foreground">({item.value})</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Progress 
                            value={item.impact} 
                            className="w-20 h-2"
                          />
                          <span className="text-sm font-mono">
                            {item.impact.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-border/30">
                    <p className="text-xs text-muted-foreground">
                      Feature importance menunjukkan kontribusi setiap parameter dalam keputusan klasifikasi
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Algorithm Tab */}
        <TabsContent value="algorithm" className="space-y-6">
          <Card className="glass-card bg-card/40 backdrop-blur-lg border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Calculator className="w-5 h-5 mr-2 text-blue-400" />
                Cara Kerja Algoritma Naive Bayes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Step 1 */}
                <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-blue-400/10 to-cyan-400/10 rounded-lg">
                  <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">Training Phase</h3>
                    <p className="text-muted-foreground mb-2">
                      Algoritma mempelajari pola dari {trainingData.length} sampel data medis yang sudah terkalibrasi:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="bg-card/60 p-3 rounded">
                        <Badge className="mb-2">Normal</Badge>
                        <p>{trainingDataByClass.Normal} sampel</p>
                      </div>
                      <div className="bg-card/60 p-3 rounded">
                        <Badge variant="secondary" className="mb-2">Kurang Normal</Badge>
                        <p>{trainingDataByClass['Kurang Normal']} sampel</p>
                      </div>
                      <div className="bg-card/60 p-3 rounded">
                        <Badge variant="destructive" className="mb-2">Berbahaya</Badge>
                        <p>{trainingDataByClass.Berbahaya} sampel</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-green-400/10 to-emerald-400/10 rounded-lg">
                  <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">Feature Analysis</h3>
                    <p className="text-muted-foreground mb-2">
                      Untuk setiap kelas, algoritma menghitung statistik (mean & variance) dari 6 parameter:
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                      <Badge variant="outline">Suhu Tubuh</Badge>
                      <Badge variant="outline">Detak Jantung</Badge>
                      <Badge variant="outline">Kadar Oksigen</Badge>
                      <Badge variant="outline">Tekanan Atas</Badge>
                      <Badge variant="outline">Tekanan Bawah</Badge>
                      <Badge variant="outline">Kualitas Sinyal</Badge>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-lg">
                  <div className="w-8 h-8 bg-purple-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">Real-time Classification</h3>
                    <p className="text-muted-foreground mb-2">
                      Saat data baru masuk dari ESP32, algoritma menghitung probabilitas untuk setiap kelas:
                    </p>
                    <div className="bg-card/40 p-3 rounded font-mono text-sm">
                      <p className="text-accent">P(Kelas|Data) = P(Data|Kelas) × P(Kelas)</p>
                      <p className="text-muted-foreground mt-1">
                        P(Data|Kelas) menggunakan distribusi Gaussian untuk setiap parameter
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-orange-400/10 to-red-400/10 rounded-lg">
                  <div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    4
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">Decision & Confidence</h3>
                    <p className="text-muted-foreground">
                      Kelas dengan probabilitas tertinggi dipilih sebagai hasil klasifikasi, 
                      disertai dengan confidence score untuk menunjukkan tingkat keyakinan algoritma.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Training Data Tab */}
        <TabsContent value="training" className="space-y-6">
          <Card className="glass-card bg-card/40 backdrop-blur-lg border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Database className="w-5 h-5 mr-2 text-green-400" />
                Dataset Training Terkalibrasi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Class Distribution */}
                <div className="space-y-4">
                  <h3 className="font-bold text-lg">Distribusi Kelas</h3>
                  {Object.entries(classDistribution).map(([label, probability]) => (
                    <div key={label} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{label}</span>
                        <span className="text-sm font-mono">
                          {((probability as number) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={(probability as number) * 100} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {trainingDataByClass[label as keyof typeof trainingDataByClass]} dari {trainingData.length} sampel
                      </p>
                    </div>
                  ))}
                </div>

                {/* Medical Calibration */}
                <div className="space-y-4">
                  <h3 className="font-bold text-lg">Kalibrasi Medis</h3>
                  <div className="bg-gradient-to-r from-accent/10 to-primary/10 p-4 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Tekanan Atas</span>
                        <Badge variant="outline">-15 mmHg</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Tekanan Bawah</span>
                        <Badge variant="outline">-10 mmHg</Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      Kalibrasi berdasarkan konsultasi medis untuk meningkatkan akurasi sensor ESP32
                    </p>
                  </div>

                  <div className="bg-card/40 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Rentang Parameter Normal:</h4>
                    <div className="text-sm space-y-1">
                      <p><span className="font-medium">Suhu:</span> 36.1-37.2°C</p>
                      <p><span className="font-medium">BPM:</span> 60-100 bpm</p>
                      <p><span className="font-medium">SpO2:</span> 95-100%</p>
                      <p><span className="font-medium">Tekanan Atas:</span> 90-120 mmHg</p>
                      <p><span className="font-medium">Tekanan Bawah:</span> 60-80 mmHg</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <Card className="glass-card bg-card/40 backdrop-blur-lg border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <BarChart3 className="w-5 h-5 mr-2 text-purple-400" />
                Model Analysis & Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analysisData && (
                <div className="space-y-6">
                  {/* Model Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg">
                      <h3 className="text-2xl font-bold text-primary">
                        {analysisData.training_data_count}
                      </h3>
                      <p className="text-sm text-muted-foreground">Training Samples</p>
                    </div>
                    
                    <div className="text-center p-4 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-lg">
                      <h3 className="text-2xl font-bold text-blue-400">
                        {analysisData.feature_count}
                      </h3>
                      <p className="text-sm text-muted-foreground">Features</p>
                    </div>
                    
                    <div className="text-center p-4 bg-gradient-to-br from-green-400/10 to-emerald-400/10 rounded-lg">
                      <h3 className="text-2xl font-bold text-green-400">
                        {Object.keys(analysisData.class_distributions).length}
                      </h3>
                      <p className="text-sm text-muted-foreground">Classes</p>
                    </div>
                    
                    <div className="text-center p-4 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-lg">
                      <h3 className="text-2xl font-bold text-purple-400">
                        {analysisData.model_complexity}
                      </h3>
                      <p className="text-sm text-muted-foreground">Parameters</p>
                    </div>
                  </div>

                  {/* Algorithm Explanation */}
                  <div className="bg-card/20 p-6 rounded-lg">
                    <h3 className="font-bold text-lg mb-3 flex items-center">
                      <Code2 className="w-5 h-5 mr-2 text-accent" />
                      Penjelasan Algoritma
                    </h3>
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap bg-card/40 p-4 rounded overflow-x-auto">
                      {analysisData.algorithm_explanation}
                    </pre>
                  </div>

                  {/* Medical Calibration Details */}
                  <div className="bg-gradient-to-r from-accent/5 to-primary/5 p-6 rounded-lg">
                    <h3 className="font-bold text-lg mb-3 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2 text-accent" />
                      Kalibrasi Medis
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-semibold">Adjustment Values:</p>
                        <p className="text-sm text-muted-foreground">
                          Tekanan Atas: {analysisData.medical_calibration.systolic_adjustment} mmHg
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Tekanan Bawah: {analysisData.medical_calibration.diastolic_adjustment} mmHg
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold">Rationale:</p>
                        <p className="text-sm text-muted-foreground">
                          {analysisData.medical_calibration.rationale}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}