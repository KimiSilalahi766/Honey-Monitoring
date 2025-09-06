import { useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Thermometer, Droplets, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HeartDataWithId } from '@shared/schema';

interface SimpleChartsProps {
  data: HeartDataWithId[];
  currentData: HeartDataWithId | null;
  className?: string;
}

interface ChartRefs {
  bpm: React.RefObject<HTMLCanvasElement>;
  suhu: React.RefObject<HTMLCanvasElement>;
  spo2: React.RefObject<HTMLCanvasElement>;
  bp: React.RefObject<HTMLCanvasElement>;
}

export function SimpleCharts({ data, currentData, className }: SimpleChartsProps) {
  const chartRefs: ChartRefs = {
    bpm: useRef<HTMLCanvasElement>(null),
    suhu: useRef<HTMLCanvasElement>(null),
    spo2: useRef<HTMLCanvasElement>(null),
    bp: useRef<HTMLCanvasElement>(null)
  };

  const chartInstances = useRef<{[key: string]: any}>({});

  useEffect(() => {
    if (typeof window === 'undefined' || data.length === 0) return;

    import('chart.js/auto').then((Chart: any) => {
      const ChartClass = Chart.default || Chart;
      
      // Prepare last 15 data points for smoother visualization
      const chartData = data.slice(0, 15).reverse();
      const labels = chartData.map(item => {
        const date = new Date(item.timestamp);
        return date.toLocaleTimeString('id-ID', { 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit'
        });
      });

      // BPM Chart
      if (chartRefs.bpm.current) {
        if (chartInstances.current.bpm) chartInstances.current.bpm.destroy();
        const ctx = chartRefs.bpm.current.getContext('2d');
        if (ctx) {
          chartInstances.current.bpm = new ChartClass(ctx, {
            type: 'line',
            data: {
              labels,
              datasets: [{
                label: 'BPM',
                data: chartData.map(item => item.bpm),
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 3,
                pointHoverRadius: 6,
                borderWidth: 2
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  titleColor: 'white',
                  bodyColor: 'white'
                }
              },
              scales: {
                x: {
                  display: true,
                  ticks: { 
                    color: 'rgb(156, 163, 175)',
                    maxTicksLimit: 5
                  },
                  grid: { color: 'rgba(156, 163, 175, 0.1)' }
                },
                y: {
                  display: true,
                  min: 50,
                  max: 120,
                  ticks: { color: 'rgb(156, 163, 175)' },
                  grid: { color: 'rgba(156, 163, 175, 0.1)' }
                }
              },
              animation: { duration: 500 }
            }
          });
        }
      }

      // Temperature Chart
      if (chartRefs.suhu.current) {
        if (chartInstances.current.suhu) chartInstances.current.suhu.destroy();
        const ctx = chartRefs.suhu.current.getContext('2d');
        if (ctx) {
          chartInstances.current.suhu = new ChartClass(ctx, {
            type: 'line',
            data: {
              labels,
              datasets: [{
                label: 'Suhu (°C)',
                data: chartData.map(item => item.suhu),
                borderColor: 'rgb(251, 146, 60)',
                backgroundColor: 'rgba(251, 146, 60, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 3,
                pointHoverRadius: 6,
                borderWidth: 2
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  titleColor: 'white',
                  bodyColor: 'white'
                }
              },
              scales: {
                x: {
                  display: true,
                  ticks: { 
                    color: 'rgb(156, 163, 175)',
                    maxTicksLimit: 5
                  },
                  grid: { color: 'rgba(156, 163, 175, 0.1)' }
                },
                y: {
                  display: true,
                  min: 35,
                  max: 40,
                  ticks: { color: 'rgb(156, 163, 175)' },
                  grid: { color: 'rgba(156, 163, 175, 0.1)' }
                }
              },
              animation: { duration: 500 }
            }
          });
        }
      }

      // SpO2 Chart
      if (chartRefs.spo2.current) {
        if (chartInstances.current.spo2) chartInstances.current.spo2.destroy();
        const ctx = chartRefs.spo2.current.getContext('2d');
        if (ctx) {
          chartInstances.current.spo2 = new ChartClass(ctx, {
            type: 'line',
            data: {
              labels,
              datasets: [{
                label: 'SpO2 (%)',
                data: chartData.map(item => item.spo2),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 3,
                pointHoverRadius: 6,
                borderWidth: 2
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  titleColor: 'white',
                  bodyColor: 'white'
                }
              },
              scales: {
                x: {
                  display: true,
                  ticks: { 
                    color: 'rgb(156, 163, 175)',
                    maxTicksLimit: 5
                  },
                  grid: { color: 'rgba(156, 163, 175, 0.1)' }
                },
                y: {
                  display: true,
                  min: 85,
                  max: 100,
                  ticks: { color: 'rgb(156, 163, 175)' },
                  grid: { color: 'rgba(156, 163, 175, 0.1)' }
                }
              },
              animation: { duration: 500 }
            }
          });
        }
      }

      // Blood Pressure Chart (Systolic)
      if (chartRefs.bp.current) {
        if (chartInstances.current.bp) chartInstances.current.bp.destroy();
        const ctx = chartRefs.bp.current.getContext('2d');
        if (ctx) {
          chartInstances.current.bp = new ChartClass(ctx, {
            type: 'line',
            data: {
              labels,
              datasets: [{
                label: 'Tekanan Atas',
                data: chartData.map(item => item.tekanan_sys),
                borderColor: 'rgb(147, 51, 234)',
                backgroundColor: 'rgba(147, 51, 234, 0.1)',
                tension: 0.4,
                fill: false,
                pointRadius: 3,
                pointHoverRadius: 6,
                borderWidth: 2
              }, {
                label: 'Tekanan Bawah',
                data: chartData.map(item => item.tekanan_dia),
                borderColor: 'rgb(168, 85, 247)',
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                tension: 0.4,
                fill: false,
                pointRadius: 3,
                pointHoverRadius: 6,
                borderWidth: 2,
                borderDash: [5, 5]
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: true,
                  position: 'top',
                  labels: {
                    color: 'rgb(156, 163, 175)',
                    font: { size: 10 }
                  }
                },
                tooltip: {
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  titleColor: 'white',
                  bodyColor: 'white'
                }
              },
              scales: {
                x: {
                  display: true,
                  ticks: { 
                    color: 'rgb(156, 163, 175)',
                    maxTicksLimit: 5
                  },
                  grid: { color: 'rgba(156, 163, 175, 0.1)' }
                },
                y: {
                  display: true,
                  min: 60,
                  max: 160,
                  ticks: { color: 'rgb(156, 163, 175)' },
                  grid: { color: 'rgba(156, 163, 175, 0.1)' }
                }
              },
              animation: { duration: 500 }
            }
          });
        }
      }
    });

    return () => {
      Object.values(chartInstances.current).forEach(instance => {
        if (instance) instance.destroy();
      });
    };
  }, [data]);

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-6", className)}>
      {/* BPM Chart */}
      <Card className="glass-card bg-gradient-to-br from-red-500/5 to-pink-500/10 backdrop-blur-lg border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center mb-3">
            <Heart className="w-5 h-5 mr-2 text-red-500" fill="currentColor" />
            <h3 className="font-semibold text-foreground">Detak Jantung (BPM)</h3>
            {currentData && (
              <span className="ml-auto text-lg font-bold text-red-500">
                {currentData.bpm}
              </span>
            )}
          </div>
          <div className="h-32">
            <canvas ref={chartRefs.bpm} className="w-full h-full" />
          </div>
        </CardContent>
      </Card>

      {/* Temperature Chart */}
      <Card className="glass-card bg-gradient-to-br from-orange-500/5 to-red-500/10 backdrop-blur-lg border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center mb-3">
            <Thermometer className="w-5 h-5 mr-2 text-orange-500" />
            <h3 className="font-semibold text-foreground">Suhu Tubuh (°C)</h3>
            {currentData && (
              <span className="ml-auto text-lg font-bold text-orange-500">
                {currentData.suhu}°
              </span>
            )}
          </div>
          <div className="h-32">
            <canvas ref={chartRefs.suhu} className="w-full h-full" />
          </div>
        </CardContent>
      </Card>

      {/* SpO2 Chart */}
      <Card className="glass-card bg-gradient-to-br from-blue-500/5 to-cyan-500/10 backdrop-blur-lg border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center mb-3">
            <Droplets className="w-5 h-5 mr-2 text-blue-500" />
            <h3 className="font-semibold text-foreground">Kadar Oksigen (SpO2)</h3>
            {currentData && (
              <span className="ml-auto text-lg font-bold text-blue-500">
                {currentData.spo2}%
              </span>
            )}
          </div>
          <div className="h-32">
            <canvas ref={chartRefs.spo2} className="w-full h-full" />
          </div>
        </CardContent>
      </Card>

      {/* Blood Pressure Chart */}
      <Card className="glass-card bg-gradient-to-br from-purple-500/5 to-indigo-500/10 backdrop-blur-lg border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center mb-3">
            <Activity className="w-5 h-5 mr-2 text-purple-500" />
            <h3 className="font-semibold text-foreground">Tekanan Darah (mmHg)</h3>
            {currentData && (
              <span className="ml-auto text-lg font-bold text-purple-500">
                {currentData.tekanan_sys}/{currentData.tekanan_dia}
              </span>
            )}
          </div>
          <div className="h-32">
            <canvas ref={chartRefs.bp} className="w-full h-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}