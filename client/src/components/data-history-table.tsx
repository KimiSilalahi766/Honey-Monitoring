import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Download, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HeartDataWithId, ParameterStatus } from '@shared/schema';

interface DataHistoryTableProps {
  data: HeartDataWithId[];
  className?: string;
}

export function DataHistoryTable({ data, className }: DataHistoryTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<keyof HeartDataWithId>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const itemsPerPage = 10;
  
  const getParameterStatus = (value: number, parameter: 'suhu' | 'bpm' | 'spo2' | 'bp'): ParameterStatus => {
    switch (parameter) {
      case 'suhu':
        if (value >= 36.1 && value <= 37.2) return 'normal';
        if (value >= 35.0 && value <= 38.0) return 'warning';
        return 'danger';
      case 'bpm':
        if (value >= 60 && value <= 100) return 'normal';
        if (value >= 50 && value <= 110) return 'warning';
        return 'danger';
      case 'spo2':
        if (value >= 95) return 'normal';
        if (value >= 90) return 'warning';
        return 'danger';
      default:
        return 'normal';
    }
  };

  const getBloodPressureStatus = (sys: number, dia: number): ParameterStatus => {
    if (sys >= 90 && sys <= 120 && dia >= 60 && dia <= 80) return 'normal';
    if (sys >= 80 && sys <= 140 && dia >= 50 && dia <= 90) return 'warning';
    return 'danger';
  };

  const getStatusColor = (status: ParameterStatus): string => {
    switch (status) {
      case 'normal':
        return 'text-accent';
      case 'warning':
        return 'text-yellow-400';
      case 'danger':
        return 'text-destructive';
    }
  };

  const getBadgeVariant = (kondisi: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (kondisi) {
      case 'Normal':
        return 'default';
      case 'Kurang Normal':
        return 'secondary';
      case 'Berbahaya':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return sortOrder === 'asc' 
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
  });

  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(data.length / itemsPerPage);

  const handleSort = (column: keyof HeartDataWithId) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Temperature (°C)', 'BPM', 'SpO2 (%)', 'Signal Quality', 'Classification'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        new Date(row.timestamp).toISOString(),
        row.suhu,
        row.bpm,
        row.spo2,
        row.signal_quality,
        row.kondisi
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `heart_data_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className={cn(
      "glass-card bg-card/40 backdrop-blur-lg border-border/50",
      className
    )}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center text-foreground">
            <Clock className="w-5 h-5 mr-2 text-primary" />
            Data History
          </CardTitle>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportToCSV}
              className="glass-card border-border/30 hover:bg-white/10"
              data-testid="button-export-csv"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="glass-card border-border/30 hover:bg-white/10"
              data-testid="button-filter"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="data-history-table">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort('timestamp')}>
                  Timestamp
                  {sortBy === 'timestamp' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort('suhu')}>
                  Temp (°C)
                  {sortBy === 'suhu' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort('bpm')}>
                  BPM
                  {sortBy === 'bpm' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort('spo2')}>
                  SpO2 (%)
                  {sortBy === 'spo2' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort('kondisi')}>
                  Classification
                  {sortBy === 'kondisi' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    No data available. Waiting for ESP32 device data...
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, index) => (
                  <tr 
                    key={row.id}
                    className="border-b border-border/30 hover:bg-white/5 dark:hover:bg-white/5 transition-colors"
                    data-testid={`table-row-${index}`}
                  >
                    <td className="py-3 px-4 font-mono text-sm">
                      {new Date(row.timestamp).toLocaleString('en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                      })}
                    </td>
                    <td className={cn(
                      "py-3 px-4 font-mono font-semibold",
                      getStatusColor(getParameterStatus(row.suhu, 'suhu'))
                    )}>
                      {typeof row.suhu === 'number' ? row.suhu.toFixed(1) : parseFloat(row.suhu || '0').toFixed(1)}
                    </td>
                    <td className={cn(
                      "py-3 px-4 font-mono font-semibold",
                      getStatusColor(getParameterStatus(row.bpm, 'bpm'))
                    )}>
                      {row.bpm}
                    </td>
                    <td className={cn(
                      "py-3 px-4 font-mono font-semibold",
                      getStatusColor(getParameterStatus(row.spo2, 'spo2'))
                    )}>
                      {row.spo2}
                    </td>
                    <td className="py-3 px-4">
                      <Badge 
                        variant={getBadgeVariant(row.kondisi)}
                        className="font-medium"
                      >
                        {row.kondisi}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data.length > itemsPerPage && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, data.length)} of {data.length} records
            </p>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="glass-card border-border/30 hover:bg-white/10 disabled:opacity-50"
                data-testid="button-previous-page"
              >
                Previous
              </Button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = currentPage <= 3 ? i + 1 : 
                              currentPage >= totalPages - 2 ? totalPages - 4 + i :
                              currentPage - 2 + i;
                              
                if (pageNum < 1 || pageNum > totalPages) return null;
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      currentPage === pageNum 
                        ? "bg-primary text-primary-foreground" 
                        : "glass-card border-border/30 hover:bg-white/10"
                    )}
                    data-testid={`button-page-${pageNum}`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button 
                variant="outline" 
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="glass-card border-border/30 hover:bg-white/10 disabled:opacity-50"
                data-testid="button-next-page"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
