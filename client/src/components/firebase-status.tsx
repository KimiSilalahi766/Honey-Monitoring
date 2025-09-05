import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Database, RefreshCw, TestTube } from "lucide-react";
import { database } from "@/lib/firebase";
import { ref, push, serverTimestamp } from "firebase/database";
import { cn } from "@/lib/utils";

interface FirebaseStatusProps {
  className?: string;
  isConnected: boolean;
  lastUpdate: Date | null;
}

export function FirebaseStatus({ className, isConnected, lastUpdate }: FirebaseStatusProps) {
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testCount, setTestCount] = useState(0);

  const sendTestData = async () => {
    setIsSendingTest(true);
    try {
      const testData = {
        timestamp: Date.now(),
        suhu: parseFloat((36.5 + Math.random() * 1.5).toFixed(1)),
        bpm: Math.floor(70 + Math.random() * 30),
        spo2: Math.floor(95 + Math.random() * 5),
        tekanan_sys: Math.floor(110 + Math.random() * 30),
        tekanan_dia: Math.floor(70 + Math.random() * 20),
        signal_quality: Math.floor(80 + Math.random() * 20),
        kondisi: Math.random() > 0.8 ? 'Kurang Normal' : 'Normal'
      };

      const dataRef = ref(database, 'data_jantung');
      await push(dataRef, testData);
      setTestCount(prev => prev + 1);
    } catch (error) {
      console.error('Error sending test data:', error);
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <Card className={cn("glass-card bg-card/60 backdrop-blur-lg border-border/50", className)}>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Database className="w-5 h-5 mr-2 text-primary" />
          Status Firebase & ESP32
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isConnected ? (
                <Wifi className="w-5 h-5 text-green-400" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-400" />
              )}
              <div>
                <p className="font-medium">Firebase Connection</p>
                <p className="text-sm text-muted-foreground">
                  {isConnected ? 'Terhubung' : 'Terputus'}
                </p>
              </div>
            </div>
            <Badge 
              variant={isConnected ? "default" : "destructive"}
              className="animate-pulse"
            >
              {isConnected ? "ONLINE" : "OFFLINE"}
            </Badge>
          </div>

          {/* Last Update */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Data Terakhir</p>
              <p className="text-sm text-muted-foreground">
                {lastUpdate 
                  ? `${Math.floor((Date.now() - lastUpdate.getTime()) / 1000)} detik lalu`
                  : 'Belum ada data'
                }
              </p>
            </div>
            {lastUpdate && (
              <Badge variant="outline" className="font-mono text-xs">
                {lastUpdate.toLocaleTimeString('id-ID')}
              </Badge>
            )}
          </div>

          {/* Test Data Button */}
          <div className="pt-4 border-t border-border/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Simulasi Data ESP32</p>
                <p className="text-sm text-muted-foreground">
                  Kirim data test untuk melihat grafik bergerak
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {testCount > 0 && (
                  <Badge variant="secondary" className="font-mono">
                    {testCount} sent
                  </Badge>
                )}
                <Button
                  onClick={sendTestData}
                  disabled={isSendingTest}
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                >
                  {isSendingTest ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <TestTube className="w-4 h-4" />
                  )}
                  {isSendingTest ? 'Mengirim...' : 'Kirim Data Test'}
                </Button>
              </div>
            </div>
          </div>

          {/* ESP32 Instructions */}
          <div className="pt-4 border-t border-border/30 bg-primary/5 p-3 rounded-lg">
            <h4 className="font-semibold text-primary mb-2">Cara Menghubungkan ESP32:</h4>
            <ol className="text-sm text-muted-foreground space-y-1">
              <li>1. Upload code ESP32_Medical_Indonesia_Final.ino ke ESP32</li>
              <li>2. Pastikan ESP32 terhubung ke WiFi yang sama</li>
              <li>3. Sensor MAX30105 terpasang dengan benar</li>
              <li>4. Data akan otomatis muncul di dashboard ini</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}