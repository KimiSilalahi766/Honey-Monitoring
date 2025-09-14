# 🧹 PANDUAN MEMBERSIHKAN FIREBASE REALTIME DATABASE

## Langkah-langkah Membersihkan Firebase Console:

### 1. **Akses Firebase Console**
- Buka browser dan pergi ke: https://console.firebase.google.com
- Login dengan akun Google yang memiliki akses ke project `monitoring-jantung-f8031`

### 2. **Navigate ke Realtime Database**
- Pilih project: `monitoring-jantung-f8031` 
- Di sidebar kiri, pilih **"Realtime Database"**
- Atau akses langsung: https://console.firebase.google.com/project/monitoring-jantung-f8031/database/monitoring-jantung-f8031-default-rtdb/data

### 3. **Identifikasi Data yang Perlu Dihapus**
Struktur database Anda saat ini:
```
/
├── data_kesehatan/         <- Jalur data ESP32 Arduino (BENAR)
│   ├── terbaru/           <- Data terbaru (KEEP)
│   └── historical_data/   <- Data historis (KEEP jika diperlukan)
├── data_jantung/          <- Data lama (HAPUS)
├── tes_koneksi/           <- Test data (HAPUS)
└── spam_data/             <- Data spam (HAPUS)
```

### 4. **Cara Menghapus Data**

#### **Hapus Satu per Satu:**
1. Click pada node data yang ingin dihapus (misal: `data_jantung`)
2. Tekan tombol **"Delete"** (ikon tempat sampah)
3. Konfirmasi dengan click **"Delete"** lagi

#### **Hapus Multiple Data:**
1. Tahan `Ctrl` (Windows) atau `Cmd` (Mac) 
2. Click beberapa node data yang ingin dihapus
3. Tekan tombol **"Delete"** 
4. Konfirmasi penghapusan

#### **Hapus Seluruh Path:**
1. Click pada root path yang ingin dihapus (misal: `/data_jantung/`)
2. Tekan **"Delete"** 
3. **HATI-HATI**: Ini akan menghapus semua data di dalam path tersebut

### 5. **Data yang HARUS DIPERTAHANKAN:**

#### **✅ KEEP - Struktur yang Benar:**
```json
{
  "data_kesehatan": {
    "terbaru": {
      "waktu": 1757856874361,
      "perangkat": "ESP32_Monitor_Jantung",
      "suhu_tubuh": "37.6",
      "detak_jantung": "83",
      "kadar_oksigen": "96", 
      "tekanan_sistolik": "115",
      "tekanan_diastolik": "87",
      "status_kesehatan": "Normal",
      "kalibrasi_sistolik": "-15",
      "kalibrasi_diastolik": "-10",
      "waktu_baca": "20.34.34"
    }
  }
}
```

### 6. **Data yang HARUS DIHAPUS:**

#### **❌ DELETE - Data Lama/Spam:**
- `/data_jantung/` - Format lama
- `/test_data/` - Data test 
- `/tes_koneksi/` - Test koneksi
- Data dengan timestamp 01/01/1970
- Data dengan nilai tidak masuk akal (suhu 0°C, BPM 999, dll)
- Data duplikat/spam

### 7. **Verifikasi Setelah Cleanup**

#### **Test Koneksi ESP32:**
1. Pastikan ESP32 Arduino masih bisa mengirim data
2. Cek di Firebase console apakah data baru masuk ke `/data_kesehatan/terbaru/`
3. Refresh web app dashboard untuk memastikan data tampil

#### **Struktur Akhir yang Benar:**
```
/
└── data_kesehatan/
    └── terbaru/           <- Hanya ini yang diperlukan
        ├── waktu          <- Timestamp NTP
        ├── perangkat      <- "ESP32_Monitor_Jantung" 
        ├── suhu_tubuh     <- String dengan 1 decimal
        ├── detak_jantung  <- String BPM
        ├── kadar_oksigen  <- String SpO2
        ├── tekanan_sistolik   <- String mmHg
        ├── tekanan_diastolik  <- String mmHg
        ├── status_kesehatan   <- "Normal"/"Kurang Normal"/"Berbahaya"
        ├── kalibrasi_sistolik <- "-15"
        ├── kalibrasi_diastolik <- "-10"
        └── waktu_baca     <- "HH.MM.SS" format
```

### 8. **Backup (Opsional)**
Jika ingin backup sebelum menghapus:
1. Click pada root `/`
2. Click **"Export JSON"** 
3. Save file backup ke komputer
4. Baru lakukan penghapusan

### 9. **Monitoring Setelah Cleanup**
- Firebase usage akan turun drastis
- Web app akan load lebih cepat
- Data real-time dari ESP32 akan lebih responsif
- Tidak ada lagi data spam/duplikat

---

## 🔒 **KEAMANAN FIREBASE (PRODUCTION)**

### Current Issues:
- ⚠️ Database rules terlalu permissive 
- ⚠️ API key exposed di client
- ⚠️ No authentication required

### Recommended for Production:
1. **Tighten database rules:**
```javascript
{
  "rules": {
    "data_kesehatan": {
      "terbaru": {
        ".read": true,
        ".write": "auth != null" // Require authentication
      }
    }
  }
}
```

2. **Implement device authentication**
3. **Rotate exposed API keys**
4. **Use Firebase Admin SDK for server operations**