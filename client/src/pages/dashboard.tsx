import { useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
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
  TrendingUp
} from "lucide-react";
import { Link } from "wouter";
import { ParameterCard } from "@/components/parameter-card";
import { ClassificationStatus } from "@/components/classification-status";
import { RealTimeChart } from "@/components/real-time-chart";
import { DataHistoryTable } from "@/components/data-history-table";
import { NotificationSystem, useNotifications } from "@/components/notification-system";
import { useFirebaseData } from "@/hooks/use-firebase-data";
import { classifyHeartCondition } from "@/lib/naive-bayes";
import type { ParameterInfo } from '@shared/schema';

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

  // Monitor for dangerous conditions and trigger alerts
  useEffect(() => {
    if (currentData && currentData.kondisi === 'Berbahaya') {
      addNotification(
        'danger',
        'Critical Alert',
        'Heart condition detected as "Berbahaya". Immediate attention required.'
      );
    } else if (currentData && currentData.kondisi === 'Kurang Normal') {
      addNotification(
        'warning', 
        'Warning',
        'Heart condition detected as "Kurang Normal". Monitor closely.'
      );
    }
  }, [currentData?.timestamp, addNotification]);

  // Get enhanced classification using client-side Naive Bayes
  const getEnhancedClassification = () => {
    if (!currentData) return null;
    
    try {
      return classifyHeartCondition({
        suhu: currentData.suhu,
        bpm: currentData.bpm,
        spo2: currentData.spo2,
        tekanan_sys: currentData.tekanan_sys,
        tekanan_dia: currentData.tekanan_dia,
        signal_quality: currentData.signal_quality
      });
    } catch (err) {
      console.error('Classification error:', err);
      return null;
    }
  };

  // Prepare parameter data for cards
  const getParameterInfo = (): Record<string, ParameterInfo> => {
    if (!currentData) return {};

    return {
      temperature: {
        value: currentData.suhu,
        unit: '°C',
        status: currentData.suhu >= 36.1 && currentData.suhu <= 37.2 ? 'normal' : 
                currentData.suhu >= 35.0 && currentData.suhu <= 38.0 ? 'warning' : 'danger',
        range: '36.1-37.2°C',
        icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l6-6v13h4l-4 6h-6z"/>'
      },
      heartRate: {
        value: currentData.bpm,
        unit: ' BPM',
        status: currentData.bpm >= 60 && currentData.bpm <= 100 ? 'normal' :
                currentData.bpm >= 50 && currentData.bpm <= 110 ? 'warning' : 'danger',
        range: '60-100 BPM',
        icon: `<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>`
      },
      bloodOxygen: {
        value: currentData.spo2,
        unit: '%',
        status: currentData.spo2 >= 95 ? 'normal' :
                currentData.spo2 >= 90 ? 'warning' : 'danger',
        range: '95-100%',
        icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>'
      },
      bloodPressure: {
        value: currentData.tekanan_sys,
        unit: `/${currentData.tekanan_dia}`,
        status: (currentData.tekanan_sys >= 90 && currentData.tekanan_sys <= 120 &&
                currentData.tekanan_dia >= 60 && currentData.tekanan_dia <= 80) ? 'normal' :
                (currentData.tekanan_sys >= 80 && currentData.tekanan_sys <= 140 &&
                currentData.tekanan_dia >= 50 && currentData.tekanan_dia <= 90) ? 'warning' : 'danger',
        range: '90-120/60-80 mmHg',
        icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>'
      }
    };
  };

  const enhancedClassification = getEnhancedClassification();
  const parameters = getParameterInfo();

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Card className="glass-card bg-card/40 backdrop-blur-lg p-8 rounded-2xl">
          <CardContent className="flex items-center space-x-3">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <span className="text-lg font-medium">Loading monitoring system...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Heart Condition Monitor
              </h1>
              <p className="text-muted-foreground">
                Real-time monitoring and early detection system
              </p>
            </div>
            
            {/* Status Indicator */}
            <Card className="glass-card bg-card/40 backdrop-blur-lg border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {isConnected ? (
                      <>
                        <div className="w-4 h-4 bg-accent rounded-full animate-ping absolute" />
                        <div className="w-4 h-4 bg-accent rounded-full relative" />
                      </>
                    ) : (
                      <div className="w-4 h-4 bg-destructive rounded-full" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {lastUpdate 
                        ? `Last update: ${Math.floor((Date.now() - lastUpdate.getTime()) / 1000)} seconds ago`
                        : 'No data received'
                      }
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                      <span>{isConnected ? 'Firebase connected' : 'Firebase disconnected'}</span>
                    </div>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={refresh}
                    disabled={loading}
                    className="ml-2"
                    data-testid="button-refresh-data"
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

        {/* Real-time Parameter Cards */}
        {currentData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <ParameterCard
              title="Temperature"
              parameter={parameters.temperature}
              progress={Math.min((currentData.suhu / 40) * 100, 100)}
              animated={parameters.temperature?.status === 'normal'}
            />
            
            <ParameterCard
              title="Heart Rate"
              parameter={parameters.heartRate}
              progress={Math.min((currentData.bpm / 120) * 100, 100)}
              animated={parameters.heartRate?.status === 'normal'}
            />
            
            <ParameterCard
              title="Blood Oxygen"
              parameter={parameters.bloodOxygen}
              progress={currentData.spo2}
              animated={parameters.bloodOxygen?.status === 'normal'}
            />
            
            <ParameterCard
              title="Blood Pressure"
              parameter={parameters.bloodPressure}
              progress={Math.min((currentData.tekanan_sys / 160) * 100, 100)}
              animated={parameters.bloodPressure?.status === 'normal'}
            />
          </div>
        )}

        {/* Classification Status & Naive Bayes Link */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {(currentData || enhancedClassification) && (
            <div className="lg:col-span-2">
              <ClassificationStatus
                classification={enhancedClassification?.classification || currentData?.kondisi || 'Unknown'}
                confidence={enhancedClassification?.confidence}
                probabilities={enhancedClassification?.probabilities}
              />
            </div>
          )}
          
          {/* Naive Bayes Analysis Link */}
          <div className="space-y-4">
            <Link href="/analysis">
              <Card className="glass-card bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-lg border-border/50 hover:from-primary/15 hover:to-accent/15 transition-all duration-300 cursor-pointer group">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-foreground">Analisis Naive Bayes</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Lihat detail algoritma machine learning dan kontribusinya dalam penelitian
                  </p>
                  <Button className="w-full bg-gradient-to-r from-primary to-accent" data-testid="button-view-analysis">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Lihat Detail
                  </Button>
                </CardContent>
              </Card>
            </Link>
            
            {/* Quick Stats */}
            <Card className="glass-card bg-card/40 backdrop-blur-lg border-border/50">
              <CardContent className="p-4">
                <h4 className="font-bold mb-3 flex items-center text-foreground">
                  <TrendingUp className="w-4 h-4 mr-2 text-accent" />
                  Model Stats
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Training Data</span>
                    <span className="font-mono">26 sampel</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Features</span>
                    <span className="font-mono">6 parameter</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Classes</span>
                    <span className="font-mono">3 kategori</span>
                  </div>
                  {enhancedClassification && (
                    <div className="flex justify-between pt-2 border-t border-border/30">
                      <span className="text-muted-foreground">Confidence</span>
                      <Badge variant={enhancedClassification.confidence > 0.7 ? "default" : "secondary"}>
                        {(enhancedClassification.confidence * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Charts and History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <RealTimeChart 
            data={historicalData} 
            currentData={currentData}
          />
          
          <Card className="glass-card bg-card/40 backdrop-blur-lg border-border/50">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center text-foreground">
                <Activity className="w-5 h-5 mr-2 text-accent" />
                Current Status
              </h3>
              
              {currentData ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-2 relative">
                      <div className="w-full h-full bg-gradient-to-br from-accent/20 to-accent/40 rounded-full flex items-center justify-center border-4 border-accent/30">
                        <span className="text-lg font-bold font-mono text-accent">
                          {currentData.bpm}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">BPM</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-2 relative">
                      <div className="w-full h-full bg-gradient-to-br from-blue-400/20 to-cyan-400/40 rounded-full flex items-center justify-center border-4 border-blue-400/30">
                        <span className="text-lg font-bold font-mono text-blue-400">
                          {currentData.spo2}%
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">SpO2</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Waiting for sensor data...</p>
                </div>
              )}
              
              {currentData && (
                <div className="mt-4 pt-4 border-t border-border/30">
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Signal Quality</span>
                    <Badge 
                      variant={currentData.signal_quality >= 80 ? "default" : 
                              currentData.signal_quality >= 60 ? "secondary" : "destructive"}
                      className="font-mono"
                    >
                      {currentData.signal_quality}%
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Data History Table */}
        <DataHistoryTable data={historicalData} />
      </div>

      {/* Notification System */}
      <NotificationSystem 
        notifications={notifications}
        onClose={removeNotification}
      />

      {/* Floating Action Button - Home */}
      <Link href="/">
        <Button
          className="fixed bottom-6 left-6 w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 z-40 group border-0"
          data-testid="button-back-to-home"
        >
          <Home className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
        </Button>
      </Link>
    </div>
  );
}
