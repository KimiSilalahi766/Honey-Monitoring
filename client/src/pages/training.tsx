import { useState, useRef } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { ArrowLeft, Upload, Plus, Trash2, Download, RefreshCw } from 'lucide-react';
import type { NaiveBayesTrainingDataType, InsertNaiveBayesTrainingData } from '@shared/schema';

export function Training() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newData, setNewData] = useState<InsertNaiveBayesTrainingData>({
    suhu: 36.5,
    bpm: 75,
    spo2: 98,
    tekanan_sys: 120,
    tekanan_dia: 80,
    signal_quality: 95,
    label: 'Normal',
    is_calibrated: 1
  });

  // Fetch training data
  const { data: trainingData = [], isLoading } = useQuery<NaiveBayesTrainingDataType[]>({
    queryKey: ['/api/training-data'],
  });

  // Add manual training data
  const addTrainingDataMutation = useMutation({
    mutationFn: (data: InsertNaiveBayesTrainingData) => {
      const requestInit: RequestInit = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      };
      return apiRequest('POST', '/api/training-data', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/training-data'] });
      toast({ title: "✓ Data training berhasil ditambahkan" });
      setNewData({
        suhu: 36.5,
        bpm: 75,
        spo2: 98,
        tekanan_sys: 120,
        tekanan_dia: 80,
        signal_quality: 95,
        label: 'Normal',
        is_calibrated: 1
      });
    },
    onError: () => {
      toast({ title: "✗ Gagal menambah data training", variant: "destructive" });
    },
  });

  // Upload CSV
  const uploadCSVMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/training-data/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/training-data'] });
      toast({ 
        title: `✓ ${result.count} data berhasil diupload`,
        description: "CSV berhasil diproses dan ditambahkan ke database"
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "✗ Gagal upload CSV", 
        description: error.message || "Format CSV tidak sesuai",
        variant: "destructive" 
      });
    },
  });

  // Delete training data
  const deleteTrainingDataMutation = useMutation({
    mutationFn: (id: number) => {
      const requestInit: RequestInit = { method: 'DELETE' };
      return apiRequest('DELETE', `/api/training-data/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/training-data'] });
      toast({ title: "✓ Data berhasil dihapus" });
    },
    onError: () => {
      toast({ title: "✗ Gagal menghapus data", variant: "destructive" });
    },
  });

  // Retrain model
  const retrainModelMutation = useMutation({
    mutationFn: () => {
      const requestInit: RequestInit = { method: 'POST' };
      return apiRequest('POST', '/api/training-data/retrain');
    },
    onSuccess: (result: any) => {
      toast({ 
        title: "✓ Model berhasil dilatih ulang",
        description: `Akurasi: ${(result.accuracy * 100).toFixed(1)}%`
      });
    },
    onError: () => {
      toast({ title: "✗ Gagal melatih ulang model", variant: "destructive" });
    },
  });

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      uploadCSVMutation.mutate(formData);
    }
  };

  const handleAddManualData = () => {
    addTrainingDataMutation.mutate(newData);
  };

  const exportCSV = () => {
    if (!trainingData.length) return;
    
    const headers = ['suhu', 'bpm', 'spo2', 'tekanan_sys', 'tekanan_dia', 'signal_quality', 'label'];
    const csvContent = [
      headers.join(','),
      ...trainingData.map((item: NaiveBayesTrainingDataType) => 
        headers.map(header => item[header as keyof NaiveBayesTrainingDataType]).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `training_data_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getClassDistribution = () => {
    if (!trainingData.length) return {};
    const distribution: Record<string, number> = {};
    trainingData.forEach((item: NaiveBayesTrainingDataType) => {
      distribution[item.label] = (distribution[item.label] || 0) + 1;
    });
    return distribution;
  };

  const classDistribution = getClassDistribution();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link to="/dashboard" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Dashboard
            </Link>
            <h1 className="text-3xl font-bold">Training Data Management</h1>
            <p className="text-muted-foreground">Kelola data training untuk algoritma Naive Bayes</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{trainingData.length}</div>
              <p className="text-xs text-muted-foreground">Sampel training</p>
            </CardContent>
          </Card>
          
          {Object.entries(classDistribution).map(([label, count]) => (
            <Card key={label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
                <p className="text-xs text-muted-foreground">
                  {trainingData.length ? Math.round((count / trainingData.length) * 100) : 0}%
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload CSV */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload CSV Data
              </CardTitle>
              <CardDescription>
                Upload file CSV dengan format: suhu,bpm,spo2,tekanan_sys,tekanan_dia,signal_quality,label
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="csv-file">Pilih File CSV</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  ref={fileInputRef}
                  disabled={uploadCSVMutation.isPending}
                  data-testid="input-csv-file"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                <p>Contoh format CSV:</p>
                <code className="block mt-1 p-2 bg-muted rounded text-xs">
                  36.5,75,98,120,80,95,Normal<br/>
                  37.2,95,94,140,90,88,Kurang Normal<br/>
                  38.1,110,88,160,100,85,Berbahaya
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Manual Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Input Manual
              </CardTitle>
              <CardDescription>
                Tambah data training secara manual
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="suhu">Suhu (°C)</Label>
                  <Input
                    id="suhu"
                    type="number"
                    step="0.1"
                    value={newData.suhu}
                    onChange={(e) => setNewData(prev => ({ ...prev, suhu: parseFloat(e.target.value) }))}
                    data-testid="input-suhu"
                  />
                </div>
                <div>
                  <Label htmlFor="bpm">BPM</Label>
                  <Input
                    id="bpm"
                    type="number"
                    value={newData.bpm}
                    onChange={(e) => setNewData(prev => ({ ...prev, bpm: parseInt(e.target.value) }))}
                    data-testid="input-bpm"
                  />
                </div>
                <div>
                  <Label htmlFor="spo2">SpO2 (%)</Label>
                  <Input
                    id="spo2"
                    type="number"
                    value={newData.spo2}
                    onChange={(e) => setNewData(prev => ({ ...prev, spo2: parseInt(e.target.value) }))}
                    data-testid="input-spo2"
                  />
                </div>
                <div>
                  <Label htmlFor="sys">Tekanan Atas</Label>
                  <Input
                    id="sys"
                    type="number"
                    value={newData.tekanan_sys}
                    onChange={(e) => setNewData(prev => ({ ...prev, tekanan_sys: parseInt(e.target.value) }))}
                    data-testid="input-tekanan-sys"
                  />
                </div>
                <div>
                  <Label htmlFor="dia">Tekanan Bawah</Label>
                  <Input
                    id="dia"
                    type="number"
                    value={newData.tekanan_dia}
                    onChange={(e) => setNewData(prev => ({ ...prev, tekanan_dia: parseInt(e.target.value) }))}
                    data-testid="input-tekanan-dia"
                  />
                </div>
                <div>
                  <Label htmlFor="quality">Quality (%)</Label>
                  <Input
                    id="quality"
                    type="number"
                    value={newData.signal_quality}
                    onChange={(e) => setNewData(prev => ({ ...prev, signal_quality: parseInt(e.target.value) }))}
                    data-testid="input-signal-quality"
                  />
                </div>
              </div>
              <div>
                <Label>Label Klasifikasi</Label>
                <Select 
                  value={newData.label}
                  onValueChange={(value) => setNewData(prev => ({ ...prev, label: value }))}
                >
                  <SelectTrigger data-testid="select-label">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Kurang Normal">Kurang Normal</SelectItem>
                    <SelectItem value="Berbahaya">Berbahaya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleAddManualData}
                disabled={addTrainingDataMutation.isPending}
                className="w-full"
                data-testid="button-add-manual-data"
              >
                {addTrainingDataMutation.isPending ? "Menambah..." : "Tambah Data"}
              </Button>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Aksi Model</CardTitle>
              <CardDescription>
                Kelola dan latih ulang model Naive Bayes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={exportCSV}
                variant="outline"
                className="w-full"
                disabled={!trainingData.length}
                data-testid="button-export-csv"
              >
                <Download className="w-4 h-4 mr-2" />
                Export ke CSV
              </Button>
              <Button
                onClick={() => retrainModelMutation.mutate()}
                disabled={retrainModelMutation.isPending || trainingData.length < 10}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500"
                data-testid="button-retrain-model"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {retrainModelMutation.isPending ? "Melatih..." : "Latih Ulang Model"}
              </Button>
              <p className="text-xs text-muted-foreground">
                {trainingData.length < 10 
                  ? `Minimum 10 data diperlukan (saat ini: ${trainingData.length})`
                  : "Model siap untuk dilatih ulang"
                }
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Training Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Data Training</CardTitle>
            <CardDescription>
              Daftar semua data yang digunakan untuk training model
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : trainingData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada data training. Silakan upload CSV atau input manual.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">ID</th>
                      <th className="text-left p-2">Suhu</th>
                      <th className="text-left p-2">BPM</th>
                      <th className="text-left p-2">SpO2</th>
                      <th className="text-left p-2">Tekanan Atas</th>
                      <th className="text-left p-2">Tekanan Bawah</th>
                      <th className="text-left p-2">Quality</th>
                      <th className="text-left p-2">Label</th>
                      <th className="text-left p-2">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainingData.slice(0, 50).map((item: NaiveBayesTrainingDataType) => (
                      <tr key={item.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">{item.id}</td>
                        <td className="p-2">{item.suhu}°C</td>
                        <td className="p-2">{item.bpm}</td>
                        <td className="p-2">{item.spo2}%</td>
                        <td className="p-2">{item.tekanan_sys}</td>
                        <td className="p-2">{item.tekanan_dia}</td>
                        <td className="p-2">{item.signal_quality}%</td>
                        <td className="p-2">
                          <Badge variant={
                            item.label === 'Normal' ? 'default' :
                            item.label === 'Kurang Normal' ? 'secondary' : 'destructive'
                          }>
                            {item.label}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTrainingDataMutation.mutate(item.id)}
                            className="text-red-500 hover:text-red-700"
                            data-testid={`button-delete-${item.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {trainingData.length > 50 && (
                  <div className="text-center py-4 text-muted-foreground">
                    Menampilkan 50 dari {trainingData.length} data
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}