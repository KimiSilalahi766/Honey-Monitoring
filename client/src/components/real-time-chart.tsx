import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HeartDataWithId } from '@shared/schema';

interface RealTimeChartProps {
  data: HeartDataWithId[];
  currentData: HeartDataWithId | null;
  className?: string;
}

export function RealTimeChart({ data, currentData, className }: RealTimeChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    if (!chartRef.current || typeof window === 'undefined') return;

    // Dynamically import Chart.js to avoid SSR issues
    import('chart.js/auto').then((Chart: any) => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      // Ensure canvas is still available after async import
      if (!chartRef.current) return;
      
      const ctx = chartRef.current.getContext('2d');
      if (!ctx) return;
      
      // Prepare data for last 20 readings
      const chartData = data.slice(0, 20).reverse();
      const labels = chartData.map(item => {
        const date = new Date(item.timestamp);
        return date.toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      });

      const ChartClass = Chart.default || Chart;
      chartInstance.current = new ChartClass(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'BPM',
              data: chartData.map(item => item.bpm),
              borderColor: 'rgb(6, 182, 212)',
              backgroundColor: 'rgba(6, 182, 212, 0.1)',
              tension: 0.4,
              fill: true,
              pointBackgroundColor: 'rgb(6, 182, 212)',
              pointBorderColor: 'rgb(6, 182, 212)',
              pointRadius: 3,
              pointHoverRadius: 6
            },
            {
              label: 'SpO2',
              data: chartData.map(item => item.spo2),
              borderColor: 'rgb(16, 185, 129)',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              tension: 0.4,
              yAxisID: 'y1',
              pointBackgroundColor: 'rgb(16, 185, 129)',
              pointBorderColor: 'rgb(16, 185, 129)',
              pointRadius: 3,
              pointHoverRadius: 6
            },
            {
              label: 'Temperature',
              data: chartData.map(item => item.suhu),
              borderColor: 'rgb(239, 68, 68)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              tension: 0.4,
              yAxisID: 'y2',
              pointBackgroundColor: 'rgb(239, 68, 68)',
              pointBorderColor: 'rgb(239, 68, 68)',
              pointRadius: 3,
              pointHoverRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            intersect: false,
            mode: 'index'
          },
          plugins: {
            legend: {
              labels: {
                color: 'rgb(156, 163, 175)',
                font: {
                  family: 'Inter, sans-serif',
                  size: 12
                }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: 'white',
              bodyColor: 'white',
              borderColor: 'rgb(6, 182, 212)',
              borderWidth: 1
            }
          },
          scales: {
            x: {
              ticks: { 
                color: 'rgb(156, 163, 175)',
                font: {
                  family: 'JetBrains Mono, monospace',
                  size: 10
                }
              },
              grid: { 
                color: 'rgba(156, 163, 175, 0.1)',
                borderColor: 'rgba(156, 163, 175, 0.3)'
              }
            },
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              min: 40,
              max: 120,
              ticks: { 
                color: 'rgb(156, 163, 175)',
                font: {
                  family: 'JetBrains Mono, monospace',
                  size: 10
                }
              },
              grid: { 
                color: 'rgba(156, 163, 175, 0.1)',
                borderColor: 'rgba(156, 163, 175, 0.3)'
              },
              title: {
                display: true,
                text: 'BPM',
                color: 'rgb(6, 182, 212)',
                font: {
                  family: 'Inter, sans-serif',
                  size: 11,
                  weight: 'bold'
                }
              }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              min: 85,
              max: 100,
              ticks: { 
                color: 'rgb(156, 163, 175)',
                font: {
                  family: 'JetBrains Mono, monospace',
                  size: 10
                }
              },
              grid: { drawOnChartArea: false },
              title: {
                display: true,
                text: 'SpO2 (%)',
                color: 'rgb(16, 185, 129)',
                font: {
                  family: 'Inter, sans-serif',
                  size: 11,
                  weight: 'bold'
                }
              }
            },
            y2: {
              type: 'linear',
              display: false,
              min: 35,
              max: 40
            }
          },
          elements: {
            line: {
              borderWidth: 2
            }
          },
          animation: {
            duration: 750,
            easing: 'easeInOutCubic'
          }
        }
      });
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  // Update chart with new data
  useEffect(() => {
    if (chartInstance.current && currentData) {
      const chart = chartInstance.current;
      const newLabel = new Date(currentData.timestamp).toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });

      // Add new data point
      chart.data.labels.push(newLabel);
      chart.data.datasets[0].data.push(currentData.bpm);
      chart.data.datasets[1].data.push(currentData.spo2);
      chart.data.datasets[2].data.push(currentData.suhu);

      // Keep only last 20 data points
      if (chart.data.labels.length > 20) {
        chart.data.labels.shift();
        chart.data.datasets.forEach((dataset: any) => {
          dataset.data.shift();
        });
      }

      chart.update('none');
    }
  }, [currentData]);

  return (
    <Card className={cn(
      "glass-card bg-card/40 backdrop-blur-lg border-border/50",
      className
    )}>
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center text-foreground">
          <Activity className="w-5 h-5 mr-2 text-primary" />
          Real-time Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 relative">
          <canvas 
            ref={chartRef}
            className="w-full h-full"
            data-testid="trends-chart"
          />
        </div>
      </CardContent>
    </Card>
  );
}
