# DAFTAR ISI

**PENERAPAN INTERNET OF THINGS DALAM IDENTIFIKASI DINI DAN MONITORING KONDISI JANTUNG SECARA REAL-TIME**

---

## BAB 1 PENDAHULUAN ..................................................................................... 1
1.1. Latar Belakang ....................................................................................... 1
1.2. Rumusan Masalah .................................................................................. 3
1.3. Batasan Masalah ..................................................................................... 4
1.4. Tujuan Penelitian .................................................................................... 5
1.5. Manfaat Penelitian .................................................................................. 6
1.6. Metodologi Penelitian ............................................................................ 7
1.7. Penelitian Relevan .................................................................................. 11
1.8. Sistematika Penulisan ........................................................................... 18

## BAB 2 LANDASAN TEORI ............................................................................... 20
2.1. Internet of Things (IoT) ........................................................................ 20
   2.1.1. Definisi dan Konsep Dasar IoT................................................... 20
   2.1.2. Arsitektur Sistem IoT .................................................................. 22
   2.1.3. Protokol Komunikasi IoT ............................................................ 24
   2.1.4. Mikrokontroller ESP32 ............................................................... 26

2.2. Sistem Monitoring Kesehatan Jantung ................................................. 28
   2.2.1. Anatomi dan Fisiologi Jantung ................................................... 28
   2.2.2. Parameter Vital Signs untuk Monitoring Jantung ....................... 30
   2.2.3. Teknologi Monitoring Jantung Terkini ....................................... 32

2.3. Sensor dan Perangkat Monitoring Kondisi Jantung ............................. 34
   2.3.1. Sensor Detak Jantung MAX30105 .............................................. 34
   2.3.2. Sensor Suhu Tubuh MLX90614 ................................................. 36
   2.3.3. Sensor Saturasi Oksigen (SpO2) ................................................ 38
   2.3.4. Sensor Tekanan Darah Digital ................................................... 40

2.4. Algoritma Machine Learning untuk Klasifikasi Medis ........................ 42
   2.4.1. Prinsip Dasar Naive Bayes ......................................................... 42
   2.4.2. Implementasi Naive Bayes untuk Data Medis ........................... 44
   2.4.3. Evaluasi Performa Algoritma Klasifikasi .................................. 46

2.5. Teknologi Web dan Database Real-time .............................................. 48
   2.5.1. Framework React dan TypeScript .............................................. 48
   2.5.2. Firebase Realtime Database ....................................................... 50
   2.5.3. Visualisasi Data dengan Chart.js ............................................... 52

2.6. Standar Medis dan Referensi Nilai Normal ......................................... 54
   2.6.1. Nilai Normal Detak Jantung ....................................................... 54
   2.6.2. Nilai Normal Suhu Tubuh ........................................................... 55
   2.6.3. Nilai Normal Saturasi Oksigen ................................................... 56
   2.6.4. Nilai Normal Tekanan Darah ...................................................... 57

## BAB 3 ANALISIS DAN PERANCANGAN ....................................................... 59
3.1. Analisis Sistem ..................................................................................... 59
   3.1.1. Analisis Masalah ......................................................................... 59
   3.1.2. Analisis Kebutuhan Sistem ......................................................... 61
   3.1.3. Analisis Kebutuhan Perangkat Keras ......................................... 63
   3.1.4. Analisis Kebutuhan Perangkat Lunak ........................................ 65

3.2. Perancangan Alur Sistem ..................................................................... 67
   3.2.1. Flowchart Sistem Keseluruhan ................................................... 67
   3.2.2. Flowchart Akuisisi Data Sensor ................................................. 69
   3.2.3. Flowchart Klasifikasi Kondisi Jantung ...................................... 71

3.3. Pemodelan Sistem ................................................................................ 73
   3.3.1. Use Case Diagram ...................................................................... 73
   3.3.2. Activity Diagram ......................................................................... 75
   3.3.3. Sequence Diagram ...................................................................... 77
   3.3.4. Class Diagram ............................................................................. 79

3.4. Perancangan Arsitektur Sistem ............................................................ 81
   3.4.1. Arsitektur Umum Sistem IoT ..................................................... 81
   3.4.2. Arsitektur Layer Sensor .............................................................. 83
   3.4.3. Arsitektur Layer Komunikasi ..................................................... 85
   3.4.4. Arsitektur Layer Aplikasi Web ................................................... 87

3.5. Perancangan Perangkat Keras .............................................................. 89
   3.5.1. Skema Rangkaian Elektronik ..................................................... 89
   3.5.2. Desain PCB dan Layout Komponen ........................................... 91
   3.5.3. Casing dan Desain Fisik Perangkat ........................................... 93

3.6. Perancangan Perangkat Lunak ............................................................. 95
   3.6.1. Perancangan Firmware ESP32 .................................................... 95
   3.6.2. Perancangan Database Firebase ................................................. 97
   3.6.3. Perancangan Web Application .................................................... 99

3.7. Perancangan Interface Pengguna ......................................................... 101
   3.7.1. Wireframe Halaman Utama ........................................................ 101
   3.7.2. Wireframe Dashboard Monitoring .............................................. 103
   3.7.3. Desain UI/UX yang User-Friendly ............................................. 105

## BAB 4 IMPLEMENTASI DAN PENGUJIAN SISTEM .................................... 107
4.1. Implementasi Sistem ............................................................................ 107
   4.1.1. Implementasi Perangkat Keras ................................................... 107
      4.1.1.1. Perakitan Komponen Sensor .............................................. 107
      4.1.1.2. Konfigurasi ESP32 dan Sensor .......................................... 109
      4.1.1.3. Testing Konektivitas Hardware .......................................... 111

   4.1.2. Implementasi Firmware ESP32 .................................................. 113
      4.1.2.1. Konfigurasi WiFi dan Firebase .......................................... 113
      4.1.2.2. Program Akuisisi Data Sensor ........................................... 115
      4.1.2.3. Implementasi Transmisi Data Real-time ............................ 117

   4.1.3. Implementasi Database Firebase ................................................ 119
      4.1.3.1. Konfigurasi Firebase Realtime Database .......................... 119
      4.1.3.2. Struktur Data dan Schema ................................................. 121
      4.1.3.3. Security Rules dan Authentication .................................... 123

   4.1.4. Implementasi Web Application .................................................. 125
      4.1.4.1. Setup Framework React dengan TypeScript ..................... 125
      4.1.4.2. Implementasi Halaman Beranda ........................................ 127
      4.1.4.3. Implementasi Dashboard Monitoring ................................. 129
      4.1.4.4. Implementasi Real-time Data Visualization ....................... 131
      4.1.4.5. Implementasi Sistem Klasifikasi Naive Bayes .................. 133

4.2. Pengujian Sistem .................................................................................. 135
   4.2.1. Pengujian Fungsionalitas Sistem ............................................... 135
      4.2.1.1. Pengujian Black Box Testing ............................................. 135
      4.2.1.2. Pengujian White Box Testing ............................................. 137

   4.2.2. Pengujian Sensor dan Akurasi Data ........................................... 139
      4.2.2.1. Pengujian Sensor Detak Jantung MAX30105 ..................... 139
      4.2.2.2. Pengujian Sensor Suhu MLX90614 .................................... 141
      4.2.2.3. Pengujian Sensor SpO2 dan Kualitas Sinyal ..................... 143
      4.2.2.4. Validasi Data dengan Alat Medis Standar ......................... 145

   4.2.3. Pengujian Algoritma Naive Bayes ............................................. 147
      4.2.3.1. Training Data dan Model Validation .................................. 147
      4.2.3.2. Testing Akurasi Klasifikasi ................................................ 149
      4.2.3.3. Confusion Matrix dan Performance Metrics ...................... 151

   4.2.4. Pengujian Integrasi Sistem End-to-End .................................... 153
      4.2.4.1. Pengujian Konektivitas IoT ke Firebase ............................ 153
      4.2.4.2. Pengujian Real-time Data Streaming ................................. 155
      4.2.4.3. Pengujian Response Time dan Latency .............................. 157

   4.2.5. Pengujian User Experience dan Interface .................................. 159
      4.2.5.1. Pengujian Usability Dashboard .......................................... 159
      4.2.5.2. Pengujian Responsiveness pada Multi-Device .................. 161
      4.2.5.3. Pengujian Sistem Notifikasi dan Alert .............................. 163

4.3. Hasil Pengujian dan Analisis Data ...................................................... 165
   4.3.1. Hasil Pengujian Berdasarkan Sampel Data Pasien .................... 165
   4.3.2. Analisis Akurasi Klasifikasi Kondisi Jantung ........................... 167
   4.3.3. Analisis Performa System Response Time ................................. 169
   4.3.4. Evaluasi Keandalan Sistem dalam Jangka Waktu Tertentu ....... 171

## BAB 5 KESIMPULAN DAN SARAN ............................................................... 173
5.1. Kesimpulan ........................................................................................... 173
   5.1.1. Pencapaian Tujuan Penelitian .................................................... 173
   5.1.2. Kontribusi Sistem terhadap Monitoring Kesehatan ................... 174
   5.1.3. Efektivitas Implementasi IoT untuk Monitoring Jantung .......... 175

5.2. Saran ..................................................................................................... 176
   5.2.1. Saran untuk Pengembangan Sistem Lanjutan ............................ 176
   5.2.2. Saran untuk Penelitian Selanjutnya ........................................... 177
   5.2.3. Saran untuk Implementasi Klinis ............................................... 178

---

## DAFTAR PUSTAKA ........................................................................................ 179

## LAMPIRAN
**Lampiran A:** Source Code Firmware ESP32 .................................................... 182
**Lampiran B:** Source Code Web Application ..................................................... 186
**Lampiran C:** Skema Rangkaian dan Dokumentasi Hardware ........................... 190
**Lampiran D:** Data Testing dan Hasil Klasifikasi ............................................. 194
**Lampiran E:** User Manual Sistem .................................................................... 198
**Lampiran F:** Sertifikat Kalibrasi Sensor .......................................................... 202

---

## DETAIL KOMPONEN YANG SUDAH DISELESAIKAN:

### ✅ **Perangkat Keras (Hardware)**
- Rangkaian ESP32 dengan sensor MAX30105, MLX90614
- Konfigurasi sensor untuk monitoring detak jantung, suhu, SpO2
- Setup konektivitas WiFi untuk transmisi data real-time

### ✅ **Firmware ESP32** 
- Program Arduino IDE lengkap dengan library sensor
- Integrasi Firebase untuk pengiriman data real-time
- Algoritma preprocessing dan validasi data sensor
- Sistem klasifikasi berbasis aturan sederhana

### ✅ **Web Application**
- Framework React dengan TypeScript dan Tailwind CSS
- Dashboard monitoring real-time dengan visualisasi canggih
- Sistem klasifikasi Naive Bayes untuk prediksi kondisi jantung
- Integrasi Firebase Realtime Database
- Interface responsive dengan desain Web3/glassmorphism
- Sistem notifikasi untuk kondisi berbahaya

### ✅ **Database dan Cloud Integration**
- Firebase Realtime Database untuk streaming data IoT
- Structure data yang optimal untuk monitoring kesehatan
- Real-time synchronization antara ESP32 dan web dashboard

### ✅ **Machine Learning Implementation**
- Algoritma Naive Bayes untuk klasifikasi kondisi jantung
- Training data berdasarkan standar medis
- Klasifikasi: Normal, Kurang Normal, Berbahaya
- Server-side dan client-side classification

Struktur daftar isi ini mencakup semua aspek penelitian dari teori hingga implementasi, dengan detail yang sesuai untuk penelitian tingkat sarjana dalam bidang IoT dan monitoring kesehatan.