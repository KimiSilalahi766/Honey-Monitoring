import { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, FileText, Heart, Clock, Users, CheckSquare, AlertCircle } from 'lucide-react';

interface SubjectData {
  id: string;
  name: string;
  age: number;
  gender: 'L' | 'P';
  consent_given: boolean;
  recording_date: string;
  recording_duration: number;
  data_quality: 'Baik' | 'Sedang' | 'Buruk';
  notes: string;
  status: 'Draft' | 'Recording' | 'Completed' | 'Archived';
}

export function DataCollection() {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<SubjectData[]>([
    {
      id: 'S001',
      name: 'Subjek 001',
      age: 25,
      gender: 'L',
      consent_given: true,
      recording_date: '2024-01-15',
      recording_duration: 300,
      data_quality: 'Baik',
      notes: 'Kondisi normal, tidak ada keluhan',
      status: 'Completed'
    },
    {
      id: 'S002', 
      name: 'Subjek 002',
      age: 32,
      gender: 'P',
      consent_given: true,
      recording_date: '2024-01-16',
      recording_duration: 450,
      data_quality: 'Baik',
      notes: 'Setelah aktivitas ringan',
      status: 'Completed'
    }
  ]);

  const [newSubject, setNewSubject] = useState<Partial<SubjectData>>({
    name: '',
    age: undefined,
    gender: 'L',
    consent_given: false,
    recording_date: new Date().toISOString().split('T')[0],
    recording_duration: 300,
    data_quality: 'Baik',
    notes: '',
    status: 'Draft'
  });

  const [checklist, setChecklist] = useState({
    esp32_connected: false,
    sensor_calibrated: false,
    firebase_ready: false,
    consent_obtained: false,
    environment_quiet: false,
    subject_resting: false
  });

  const addSubject = () => {
    if (!newSubject.name || !newSubject.age) {
      toast({ title: "✗ Mohon lengkapi data subjek", variant: "destructive" });
      return;
    }

    const id = `S${String(subjects.length + 1).padStart(3, '0')}`;
    const subject: SubjectData = {
      id,
      name: newSubject.name,
      age: newSubject.age!,
      gender: newSubject.gender!,
      consent_given: newSubject.consent_given!,
      recording_date: newSubject.recording_date!,
      recording_duration: newSubject.recording_duration!,
      data_quality: newSubject.data_quality!,
      notes: newSubject.notes!,
      status: newSubject.status!
    };

    setSubjects([...subjects, subject]);
    setNewSubject({
      name: '',
      age: undefined,
      gender: 'L',
      consent_given: false,
      recording_date: new Date().toISOString().split('T')[0],
      recording_duration: 300,
      data_quality: 'Baik',
      notes: '',
      status: 'Draft'
    });

    toast({ title: "✓ Subjek berhasil ditambahkan" });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Recording': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'Archived': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getDataQualityColor = (quality: string) => {
    switch (quality) {
      case 'Baik': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Sedang': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Buruk': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const completedSubjects = subjects.filter(s => s.status === 'Completed').length;
  const totalRecordingTime = subjects.reduce((sum, s) => sum + s.recording_duration, 0);
  const avgAge = subjects.length > 0 ? Math.round(subjects.reduce((sum, s) => sum + s.age, 0) / subjects.length) : 0;
  const genderDistribution = {
    L: subjects.filter(s => s.gender === 'L').length,
    P: subjects.filter(s => s.gender === 'P').length
  };

  const allChecklistComplete = Object.values(checklist).every(Boolean);

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
            <h1 className="text-3xl font-bold">Data Collection Protocol</h1>
            <p className="text-muted-foreground">Protokol pengumpulan data dan manajemen subjek penelitian</p>
          </div>
        </div>

        {/* Research Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Total Subjek
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subjects.length}</div>
              <p className="text-xs text-muted-foreground">
                Target: 30-60 subjek
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <CheckSquare className="w-4 h-4 mr-2" />
                Selesai
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedSubjects}</div>
              <p className="text-xs text-muted-foreground">
                {subjects.length > 0 ? Math.round((completedSubjects / subjects.length) * 100) : 0}% progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Total Waktu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(totalRecordingTime / 60)}m</div>
              <p className="text-xs text-muted-foreground">
                Recording time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Rata-rata Usia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgAge}</div>
              <p className="text-xs text-muted-foreground">
                tahun
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Gender
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold">
                L: {genderDistribution.L} | P: {genderDistribution.P}
              </div>
              <p className="text-xs text-muted-foreground">
                Distribusi
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recording Checklist */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5" />
                Recording Checklist
              </CardTitle>
              <CardDescription>
                Pastikan semua item checklist sebelum mulai recording
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[
                  { key: 'esp32_connected', label: 'ESP32 terhubung dan online' },
                  { key: 'sensor_calibrated', label: 'Sensor MAX30105 dikalibrasi' },
                  { key: 'firebase_ready', label: 'Firebase Realtime DB ready' },
                  { key: 'consent_obtained', label: 'Informed consent diperoleh' },
                  { key: 'environment_quiet', label: 'Lingkungan tenang dan nyaman' },
                  { key: 'subject_resting', label: 'Subjek dalam kondisi istirahat' }
                ].map((item) => (
                  <div key={item.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={item.key}
                      checked={checklist[item.key as keyof typeof checklist]}
                      onCheckedChange={(checked) => 
                        setChecklist(prev => ({ ...prev, [item.key]: checked }))
                      }
                      data-testid={`checkbox-${item.key}`}
                    />
                    <Label htmlFor={item.key} className="text-sm">
                      {item.label}
                    </Label>
                  </div>
                ))}
              </div>
              
              <div className={`p-3 rounded-lg border-2 ${
                allChecklistComplete 
                  ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                  : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800'
              }`}>
                <div className="flex items-center gap-2">
                  {allChecklistComplete ? (
                    <CheckSquare className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                  )}
                  <span className="text-sm font-medium">
                    {allChecklistComplete ? 'Siap untuk recording' : 'Checklist belum lengkap'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add New Subject */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Tambah Subjek Baru
              </CardTitle>
              <CardDescription>
                Input data subjek penelitian
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="subject-name">Nama/ID Subjek</Label>
                <Input
                  id="subject-name"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Subjek 001"
                  data-testid="input-subject-name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="subject-age">Usia</Label>
                  <Input
                    id="subject-age"
                    type="number"
                    value={newSubject.age || ''}
                    onChange={(e) => setNewSubject(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                    placeholder="25"
                    data-testid="input-subject-age"
                  />
                </div>
                <div>
                  <Label htmlFor="subject-gender">Gender</Label>
                  <select
                    id="subject-gender"
                    value={newSubject.gender}
                    onChange={(e) => setNewSubject(prev => ({ ...prev, gender: e.target.value as 'L' | 'P' }))}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    data-testid="select-subject-gender"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="recording-date">Tanggal Recording</Label>
                <Input
                  id="recording-date"
                  type="date"
                  value={newSubject.recording_date}
                  onChange={(e) => setNewSubject(prev => ({ ...prev, recording_date: e.target.value }))}
                  data-testid="input-recording-date"
                />
              </div>

              <div>
                <Label htmlFor="recording-duration">Durasi Recording (detik)</Label>
                <Input
                  id="recording-duration"
                  type="number"
                  value={newSubject.recording_duration}
                  onChange={(e) => setNewSubject(prev => ({ ...prev, recording_duration: parseInt(e.target.value) }))}
                  placeholder="300"
                  data-testid="input-recording-duration"
                />
              </div>

              <div>
                <Label htmlFor="notes">Catatan</Label>
                <Textarea
                  id="notes"
                  value={newSubject.notes}
                  onChange={(e) => setNewSubject(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Kondisi subjek saat recording..."
                  rows={3}
                  data-testid="textarea-notes"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="consent"
                  checked={newSubject.consent_given}
                  onCheckedChange={(checked) => 
                    setNewSubject(prev => ({ ...prev, consent_given: checked as boolean }))
                  }
                  data-testid="checkbox-consent"
                />
                <Label htmlFor="consent" className="text-sm">
                  Informed consent telah diperoleh
                </Label>
              </div>

              <Button 
                onClick={addSubject}
                className="w-full"
                disabled={!newSubject.name || !newSubject.age || !newSubject.consent_given}
                data-testid="button-add-subject"
              >
                Tambah Subjek
              </Button>
            </CardContent>
          </Card>

          {/* Consent Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Informed Consent
              </CardTitle>
              <CardDescription>
                Template informed consent untuk penelitian
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                <h4 className="font-semibold">FORMULIR PERSETUJUAN PENELITIAN</h4>
                <p className="text-xs leading-relaxed">
                  <strong>Judul Penelitian:</strong><br/>
                  &quot;Penerapan Internet of Things dalam Identifikasi Dini dan Monitoring Kondisi Jantung Secara Real-Time&quot;
                </p>
                <p className="text-xs leading-relaxed">
                  <strong>Tujuan:</strong><br/>
                  Penelitian ini bertujuan mengembangkan sistem monitoring jantung menggunakan IoT dengan klasifikasi Naive Bayes untuk deteksi dini kondisi jantung.
                </p>
                <p className="text-xs leading-relaxed">
                  <strong>Prosedur:</strong><br/>
                  • Pemasangan sensor non-invasif (5-10 menit)<br/>
                  • Recording vital signs selama 5-10 menit<br/>
                  • Data disimpan secara anonim untuk penelitian
                </p>
                <p className="text-xs leading-relaxed">
                  <strong>Risiko:</strong><br/>
                  Risiko minimal, sensor non-invasif dan aman digunakan.
                </p>
                <p className="text-xs leading-relaxed">
                  <strong>Kerahasiaan:</strong><br/>
                  Data akan dijaga kerahasiaannya dan hanya digunakan untuk keperluan penelitian akademik.
                </p>
                <p className="text-xs font-medium">
                  Saya memahami dan menyetujui untuk berpartisipasi dalam penelitian ini.
                </p>
              </div>
              <Button variant="outline" className="w-full" data-testid="button-print-consent">
                <FileText className="w-4 h-4 mr-2" />
                Print Consent Form
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Subject List */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Subjek Penelitian</CardTitle>
            <CardDescription>
              Manajemen data subjek dan status recording
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">ID</th>
                    <th className="text-left p-2">Nama</th>
                    <th className="text-left p-2">Usia</th>
                    <th className="text-left p-2">Gender</th>
                    <th className="text-left p-2">Tanggal</th>
                    <th className="text-left p-2">Durasi</th>
                    <th className="text-left p-2">Kualitas</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((subject) => (
                    <tr key={subject.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-mono text-xs">{subject.id}</td>
                      <td className="p-2">{subject.name}</td>
                      <td className="p-2">{subject.age}</td>
                      <td className="p-2">{subject.gender}</td>
                      <td className="p-2">{new Date(subject.recording_date).toLocaleDateString('id-ID')}</td>
                      <td className="p-2">{Math.round(subject.recording_duration / 60)}m</td>
                      <td className="p-2">
                        <Badge className={getDataQualityColor(subject.data_quality)}>
                          {subject.data_quality}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <Badge className={getStatusColor(subject.status)}>
                          {subject.status}
                        </Badge>
                      </td>
                      <td className="p-2 max-w-xs truncate" title={subject.notes}>
                        {subject.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {subjects.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Belum ada subjek penelitian. Tambahkan subjek untuk memulai pengumpulan data.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}