# IoT Heart Monitoring System - Real-Time Detection & Classification

## 📖 Deskripsi Project

Sistem monitoring kondisi jantung berbasis Internet of Things (IoT) untuk identifikasi dini dan monitoring real-time menggunakan ESP32, sensor biomedis, dan machine learning Naive Bayes classifier. Project ini dikembangkan sebagai implementasi dari thesis **"PENERAPAN INTERNET OF THINGS DALAM IDENTIFIKASI DINI DAN MONITORING KONDISI JANTUNG SECARA REAL-TIME"**.

### ✨ Fitur Utama
- **Real-time Monitoring**: Data vital signs streaming dari ESP32 ke web dashboard
- **AI Classification**: Naive Bayes untuk klasifikasi kondisi (Normal, Kurang Normal, Berbahaya)  
- **Research Tools**: Training data management, model evaluation, data collection protocol
- **Multi-sensor Integration**: Suhu tubuh, heart rate, SpO2, dan blood pressure
- **Firebase Integration**: Real-time database untuk IoT data streaming
- **Medical Calibration**: Kalibrasi hasil sensor sesuai standar medis

---

## 🏗️ System Architecture

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐    ┌──────────────┐
│     ESP32       │    │   Firebase   │    │   Web App       │    │  PostgreSQL  │
│   + Sensors     │───▶│  Realtime DB │───▶│ React+TypeScript│───▶│   Database   │
└─────────────────┘    └──────────────┘    └─────────────────┘    └──────────────┘
        │                       │                     │                    │
   ┌────▼────┐             ┌────▼────┐          ┌─────▼─────┐         ┌────▼────┐
   │MAX30105 │             │ IoT Data│          │ Dashboard │         │Training │
   │MLX90614 │             │Streaming│          │ Monitoring│         │   Data  │
   └─────────┘             └─────────┘          └───────────┘         └─────────┘
                                                       │
                                                ┌──────▼──────┐
                                                │Naive Bayes  │
                                                │Classifier   │
                                                └─────────────┘
```

### 📊 Data Flow Architecture

```
┌─────────────┐    WiFi    ┌──────────────┐    WebSocket   ┌─────────────┐
│ ESP32 Sensor│ ─────────▶ │   Firebase   │ ─────────────▶ │  React App  │
│    Data     │            │ Realtime DB  │                │  Dashboard  │
└─────────────┘            └──────────────┘                └─────────────┘
      │                           │                               │
      │                           │                               ▼
      ▼                           ▼                    ┌─────────────────┐
┌─────────────┐            ┌─────────────┐            │ Naive Bayes     │
│ Calibration │            │    Auto     │            │ Classification  │
│ Algoritm    │            │   Storage   │            │ + Confidence    │
└─────────────┘            └─────────────┘            └─────────────────┘
```

---

## 🔧 Setup dan Instalasi

### Prerequisites

**Software Requirements:**
- Node.js v18 atau lebih baru
- npm atau yarn
- Visual Studio Code (recommended)
- Arduino IDE
- Git

**Hardware Requirements:**
- ESP32 DevKit v1
- MAX30105 Sensor (Heart Rate + SpO2)
- MLX90614 Sensor (Temperature)
- Breadboard dan jumper wires
- USB Cable untuk ESP32
- Power supply 5V (opsional)

### 🚀 Installation Steps

#### 1. Clone Repository
```bash
git clone [repository-url]
cd iot-heart-monitoring
```

#### 2. Install Dependencies
```bash
# Install Node.js dependencies
npm install

# Install additional packages if needed
npm install @neondatabase/serverless firebase drizzle-orm
```

#### 3. Database Setup
```bash
# Push database schema
npm run db:push

# Optional: Seed sample data
npm run seed
```

#### 4. Environment Configuration
Buat file `.env` di root directory:
```env
DATABASE_URL="your_postgresql_connection_string"
VITE_FIREBASE_API_KEY="your_firebase_api_key"
VITE_FIREBASE_AUTH_DOMAIN="your_project.firebaseapp.com"
VITE_FIREBASE_DATABASE_URL="https://your_project.firebaseio.com"
VITE_FIREBASE_PROJECT_ID="your_project_id"
```

#### 5. Run Development Server
```bash
npm run dev
```

Server akan berjalan di `http://localhost:5000`

---

## 🔥 Firebase Setup

### 1. Create Firebase Project
1. Buka [Firebase Console](https://console.firebase.google.com)
2. Klik "Create Project"
3. Masukkan nama project: `iot-heart-monitoring`
4. Disable Google Analytics (optional)
5. Klik "Create Project"

### 2. Enable Realtime Database
1. Di Firebase Console, pilih "Realtime Database"
2. Klik "Create Database"
3. Pilih lokasi server (Asia-Southeast)
4. Start in "Test Mode" untuk development
5. Database rules untuk development:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

### 3. Get Firebase Configuration
1. Project Settings → General → Your Apps
2. Klik "Web App" icon
3. Register app dengan nama "Heart Monitor Web"
4. Copy configuration object ke `.env` file

### 4. Database Structure
```
heart-monitor-db/
├── sensorData/
│   ├── timestamp1/
│   │   ├── suhu: 36.8
│   │   ├── bpm: 78
│   │   ├── spo2: 98
│   │   ├── tekanan_sys: 105
│   │   ├── tekanan_dia: 70
│   │   ├── signal_quality: 85
│   │   └── kondisi: "Normal"
│   └── timestamp2/...
└── deviceStatus/
    └── ESP32_Monitor_Jantung/
        ├── lastSeen: timestamp
        ├── status: "online"
        └── firmware: "1.0.0"
```

---

## ⚡ Hardware Setup - ESP32

### 🔌 Wiring Diagram

```
ESP32 DevKit v1        MAX30105           MLX90614
┌─────────────────┐    ┌─────────────┐    ┌─────────────┐
│              3V3│────│VCC          │    │VCC          │
│              GND│────│GND          │────│GND          │
│         GPIO 21 │────│SDA          │────│SDA          │
│         GPIO 22 │────│SCL          │────│SCL          │
└─────────────────┘    └─────────────┘    └─────────────┘
```

### 📋 Pin Configuration
| ESP32 Pin | Sensor Pin | Function |
|-----------|------------|----------|
| 3V3       | VCC        | Power Supply |
| GND       | GND        | Ground |
| GPIO 21   | SDA        | I2C Data Line |
| GPIO 22   | SCL        | I2C Clock Line |

### 🔧 Arduino IDE Setup

1. **Install ESP32 Board Package:**
   - File → Preferences
   - Additional Board Manager URLs: 
     ```
     https://dl.espressif.com/dl/package_esp32_index.json
     ```
   - Tools → Board → Board Manager → Search "ESP32" → Install

2. **Install Required Libraries:**
   ```
   Tools → Manage Libraries → Install:
   - MAX30105lib by SparkFun
   - Adafruit MLX90614 Library
   - Firebase ESP32 Client
   - ArduinoJson
   - WiFi (built-in)
   ```

3. **Board Configuration:**
   - Board: "ESP32 Dev Module"
   - Upload Speed: "921600"
   - CPU Frequency: "240MHz"
   - Flash Frequency: "80MHz"
   - Flash Size: "4MB"
   - Port: Select appropriate COM port

### 📝 Arduino Code Setup

1. **Open Arduino File:**
   ```
   File → Open → ESP32_Medical_Indonesia_Final.ino
   ```

2. **Configure WiFi dan Firebase:**
   ```cpp
   // WiFi Configuration
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   
   // Firebase Configuration
   const char* firebaseHost = "your-project.firebaseio.com";
   const char* firebaseAuth = "your_database_secret";
   ```

3. **Upload Code:**
   - Connect ESP32 via USB
   - Select correct COM port
   - Click Upload button
   - Monitor Serial output (115200 baud)

### 🚦 Status Indicators
- **WiFi Connected:** LED blink pattern atau Serial "WiFi Connected"
- **Firebase Connected:** Serial "Firebase Connected"  
- **Sensor OK:** Serial "MAX30105 OK", "MLX90614 OK"
- **Data Sending:** Serial output data setiap 3 detik

---

## 💻 Web Application Usage

### 🏠 Dashboard (`/dashboard`)

**Fitur Utama:**
- **Real-time Monitoring Cards**: 4 parameter vital signs
- **AI Classification Result**: Status Normal/Kurang Normal/Berbahaya
- **Live Charts**: Trend grafik real-time 15 data terakhir
- **Historical Data**: List 5 record terakhir dengan timestamp
- **Firebase Status**: Indikator koneksi ESP32
- **Test Button**: Simulasi data jika ESP32 belum tersedia

**Cara Penggunaan:**
1. Buka `http://localhost:5000/dashboard`
2. Pastikan ESP32 terkoneksi dan data masuk
3. Letakkan jari di sensor MAX30105
4. Tunggu 10-15 detik untuk stabilisasi signal
5. Amati data real-time di cards dan grafik
6. Perhatikan hasil klasifikasi AI di box hijau/kuning/merah

**Parameter yang Ditampilkan:**
- **Suhu Tubuh**: 36.1-37.2°C (Normal)
- **BPM**: 60-100 beats per minute (Normal)
- **SpO2**: 95-100% saturasi oksigen (Normal)
- **Tekanan Darah**: 90-120/60-80 mmHg (Normal)

### 📚 Training Data Management (`/training`)

**Fitur Utama:**
- **CSV Upload**: Bulk import training dataset
- **Manual Input**: Form input satu record
- **Data Table**: Management CRUD training data
- **Model Retraining**: Update classifier dengan data baru
- **Export Function**: Download data dalam format CSV

**Cara Penggunaan:**

1. **Upload CSV Data:**
   ```
   Format CSV Header:
   suhu,bpm,spo2,tekanan_sys,tekanan_dia,signal_quality,label
   
   Contoh Data:
   36.8,78,98,105,70,85,Normal
   38.2,105,94,120,85,75,Kurang Normal  
   39.1,125,89,140,95,65,Berbahaya
   ```

2. **Manual Input:**
   - Isi semua field form
   - Pilih label: Normal/Kurang Normal/Berbahaya
   - Klik "Tambah Data Training"

3. **Retrain Model:**
   - Minimal 10 data untuk training
   - Klik "Retrain Model" 
   - Tunggu proses selesai
   - Lihat akurasi hasil training

### 📊 Research Evaluation (`/evaluation`)

**Fitur Utama:**
- **Confusion Matrix**: Visualisasi 3x3 matrix klasifikasi
- **Performance Metrics**: Precision, Recall, F1-Score per kelas
- **Cross Validation**: 5-fold CV dengan confidence interval  
- **Statistical Summary**: Overall accuracy dan distribusi error
- **Research Conclusions**: Interpretasi hasil dan rekomendasi

**Cara Penggunaan:**
1. Pastikan memiliki minimal 10 training data
2. Buka `/evaluation`
3. Sistem otomatis generate confusion matrix
4. Analisis metrik performa per kelas
5. Baca kesimpulan penelitian di bagian bawah

**Metrik yang Ditampilkan:**
- **Overall Accuracy**: Akurasi keseluruhan model
- **Precision**: Ketepatan prediksi per kelas
- **Recall**: Coverage prediksi per kelas  
- **F1-Score**: Harmonic mean precision dan recall
- **Cross-Validation**: Mean ± standard deviation

### 📋 Data Collection Protocol (`/data-collection`)

**Fitur Utama:**
- **Subject Registration**: Form pendaftaran subjek penelitian
- **Informed Consent**: Template persetujuan penelitian
- **Recording Checklist**: SOP pengambilan data
- **Research Statistics**: Progress dan distribusi subjek

**Workflow Penggunaan:**

1. **Subject Registration:**
   - Isi form: Nama, Umur, Jenis Kelamin
   - Riwayat medis (optional)
   - Generate Subject ID unik
   - Status: Active/Completed

2. **Informed Consent:**
   - Baca template consent form
   - Tanda tangan digital atau print
   - Timestamp dan arsip consent
   - Wajib sebelum recording

3. **Recording Session:**
   ```
   Checklist Persiapan:
   ☐ Environment tenang dan terkontrol
   ☐ Subjek duduk nyaman, rileks 5 menit  
   ☐ Sensor ESP32 terpasang dengan benar
   ☐ Koneksi WiFi dan Firebase stabil
   ☐ Web dashboard ready untuk monitoring
   
   Recording Protocol:
   ☐ Baseline recording 2-5 menit
   ☐ Light activity (optional)
   ☐ Recovery recording 2-5 menit
   ☐ Data quality check
   ☐ Subject feedback
   ```

4. **Statistics Dashboard:**
   - Total subjek: 15 registered
   - Completed sessions: 12/15
   - Gender distribution: Male 53%, Female 47%
   - Age groups: 18-25 (33%), 26-35 (40%), 36-45 (20%), 45+ (7%)

---

## 🔬 Research Methodology

### 📊 Data Collection Protocol

**Study Design:** Prospective observational study  
**Sample Size:** 30-60 subjek (minimal)  
**Age Range:** 18-65 tahun  
**Inclusion Criteria:** Dewasa sehat, bisa memberikan consent
**Exclusion Criteria:** Demam >38.5°C, kondisi medis tidak stabil

**Recording Protocol:**
1. **Pre-recording (5 menit):**
   - Subjek duduk tenang
   - Aklimatisasi dengan sensor
   - Check baseline vital signs

2. **Main Recording (3-5 menit):**
   - Continuous monitoring
   - Minimal movement
   - Quality signal check

3. **Post-recording:**
   - Data validation
   - Medical assessment
   - Label assignment

### 🏥 Medical Validation

**Labeling Process:**
- Dilakukan oleh tenaga medis terlatih
- Berdasarkan kriteria klinis standar
- Inter-rater reliability assessment
- Blind terhadap model prediction

**Classification Criteria:**
```
NORMAL:
- Suhu: 36.1-37.2°C
- BPM: 60-100
- SpO2: 95-100%
- Tekanan: 90-120/60-80 mmHg

KURANG NORMAL:
- Suhu: 37.3-38.0°C atau 35.5-36.0°C
- BPM: 100-120 atau 50-60
- SpO2: 90-94%
- Tekanan: 120-140/80-90 mmHg

BERBAHAYA:
- Suhu: >38.0°C atau <35.5°C
- BPM: >120 atau <50
- SpO2: <90%
- Tekanan: >140/90 mmHg
```

### 🧠 Machine Learning Pipeline

**Algorithm:** Gaussian Naive Bayes  
**Features:** 6 parameter [suhu, bpm, spo2, sys, dia, quality]  
**Classes:** 3 kategori [Normal, Kurang Normal, Berbahaya]

**Training Process:**
1. Feature extraction dari raw sensor data
2. Medical calibration (-15 mmHg sys, -10 mmHg dia)
3. Normalization dan quality filtering
4. Gaussian distribution modeling per class
5. Cross-validation untuk model evaluation

**Evaluation Metrics:**
- **Accuracy**: (TP + TN) / Total
- **Precision**: TP / (TP + FP) per class
- **Recall**: TP / (TP + FN) per class
- **F1-Score**: 2 × (Precision × Recall) / (Precision + Recall)

---

## 🧪 Testing & Troubleshooting

### ✅ System Health Check

1. **Hardware Check:**
   ```bash
   # ESP32 Serial Monitor Output Should Show:
   WiFi connected!
   Firebase connected!  
   MAX30105 sensor OK
   MLX90614 sensor OK
   Sending data... OK
   ```

2. **Web Application Check:**
   ```bash
   # Development server
   npm run dev
   
   # Database connectivity
   npm run db:check
   
   # Firebase connection test
   curl http://localhost:5000/api/test-data
   ```

3. **End-to-End Test:**
   - ESP32 → Firebase → Web real-time update
   - Data classification working
   - Historical data storage
   - All pages responsive

### 🐛 Common Issues & Solutions

**ESP32 Issues:**

| Problem | Symptoms | Solution |
|---------|----------|----------|
| WiFi Connection Failed | Serial: "WiFi connection timeout" | Check SSID/password, signal strength |
| Firebase Error | Serial: "Firebase connection failed" | Verify Firebase URL/auth token |
| Sensor Not Detected | Serial: "MAX30105 not found" | Check I2C wiring, sensor power |
| Poor Signal Quality | Inconsistent readings | Clean sensor, proper finger placement |

**Web Application Issues:**

| Problem | Symptoms | Solution |
|---------|----------|----------|
| No Real-time Data | Dashboard empty, no updates | Check Firebase config, ESP32 status |
| Classification Error | "Insufficient training data" | Add training data, retrain model |
| Database Connection | 500 server errors | Check DATABASE_URL, run db:push |
| Page Not Loading | White screen, console errors | Clear cache, check dependencies |

**Development Environment:**

```bash
# Reset database
npm run db:reset

# Clear node modules
rm -rf node_modules package-lock.json
npm install

# Check log files
tail -f logs/app.log

# Firebase debug mode
export FIREBASE_DEBUG=true
```

### 🔍 Debug Tools

**ESP32 Debugging:**
```cpp
// Enable debug mode in Arduino code
#define DEBUG_MODE true
#define SERIAL_BAUDRATE 115200

// Monitor output
Serial.println("Debug: Sensor reading...");
Serial.print("BPM: "); Serial.println(heartRate);
```

**Web Application Debugging:**
```javascript
// Browser Developer Tools
console.log("Firebase data:", data);
localStorage.getItem('debug_mode');

// Network tab untuk API calls
// React DevTools untuk component state
```

---

## 📈 Performance Optimization

### ⚡ ESP32 Optimization
- **Sensor Sampling Rate**: 25Hz optimal untuk balance accuracy/power
- **WiFi Power Management**: Sleep mode between transmissions
- **Data Compression**: JSON minification sebelum upload
- **Error Handling**: Retry mechanism dengan exponential backoff

### 🚀 Web Application Optimization  
- **Real-time Updates**: Debounced Firebase listeners (2-3 detik)
- **Chart Rendering**: Canvas optimization, data windowing (15 points)
- **State Management**: React Query untuk caching dan invalidation
- **Bundle Size**: Code splitting, lazy loading untuk halaman

### 💾 Database Optimization
- **Indexing**: Timestamp dan device_id untuk quick queries
- **Data Retention**: Auto-cleanup data >30 hari untuk development
- **Connection Pooling**: Neon serverless PostgreSQL
- **Query Optimization**: Limit, offset untuk pagination

---

## 🔒 Security & Privacy

### 🛡️ Data Protection
- **Pseudonymization**: Subject ID tidak terkait nama asli
- **Access Control**: Firebase rules berdasarkan user authentication
- **Encryption**: HTTPS untuk web traffic, TLS untuk database
- **Data Retention**: Policy delete after research complete

### 🔐 Authentication & Authorization
```javascript
// Firebase Security Rules (Production)
{
  "rules": {
    "sensorData": {
      ".read": "auth != null && auth.token.role == 'researcher'",
      ".write": "auth != null"
    },
    "subjects": {
      ".read": "auth != null && auth.token.role == 'researcher'", 
      ".write": "auth != null && auth.token.role == 'researcher'"
    }
  }
}
```

### 📋 Compliance Checklist
- ✅ Informed consent forms
- ✅ Data anonymization
- ✅ Secure data transmission
- ✅ Access logging dan audit trail
- ⚠️ Ethics committee approval (required)
- ⚠️ Data retention and deletion policy

---

## 📚 API Documentation

### 🌐 REST Endpoints

**Heart Data Management:**
```bash
# Get historical data
GET /api/heart-data?limit=100&offset=0

# Store new sensor data  
POST /api/heart-data
Content-Type: application/json
{
  "suhu": 36.8,
  "bpm": 78,
  "spo2": 98,
  "tekanan_sys": 105,
  "tekanan_dia": 70,
  "signal_quality": 85
}

# Seed sample data for testing
POST /api/seed-data
```

**Training Data Management:**
```bash
# Get training data
GET /api/training-data

# Add training example
POST /api/training-data  
{
  "suhu": 36.8,
  "bpm": 78,
  "spo2": 98, 
  "tekanan_sys": 105,
  "tekanan_dia": 70,
  "signal_quality": 85,
  "label": "Normal"
}

# Delete training example
DELETE /api/training-data/:id

# Upload CSV training data
POST /api/training-data/upload
Content-Type: multipart/form-data

# Retrain model
POST /api/training-data/retrain
```

**Model Evaluation:**
```bash
# Get evaluation metrics
GET /api/evaluation
Response:
{
  "overall_accuracy": 0.867,
  "precision": {"Normal": 0.90, "Kurang Normal": 0.85, "Berbahaya": 0.86},
  "recall": {"Normal": 0.90, "Kurang Normal": 0.85, "Berbahaya": 0.86},
  "f1_score": {"Normal": 0.90, "Kurang Normal": 0.85, "Berbahaya": 0.86},
  "confusion_matrix": [[4,0,0],[1,3,0],[0,1,3]],
  "cross_validation_scores": [0.83, 0.92, 0.87, 0.85, 0.89],
  "mean_cv_score": 0.872
}
```

**Data Collection:**
```bash  
# Get subjects
GET /api/subjects

# Register new subject
POST /api/subjects
{
  "name": "Subject A",
  "age": 25, 
  "gender": "Laki-laki",
  "medicalHistory": "Tidak ada"
}

# Submit consent form
POST /api/consent
{
  "subjectId": 1,
  "consentGiven": true,
  "signature": "digital_signature_hash"
}

# Get research statistics  
GET /api/data-collection/stats
```

### 🔥 Firebase Realtime Database

**Data Structure:**
```json
{
  "sensorData": {
    "1693920000000": {
      "timestamp": 1693920000000,
      "device_id": "ESP32_Monitor_Jantung",
      "suhu": 36.8,
      "bpm": 78,
      "spo2": 98,
      "tekanan_sys": 105, 
      "tekanan_dia": 70,
      "signal_quality": 85,
      "kondisi": "Normal"
    }
  },
  "deviceStatus": {
    "ESP32_Monitor_Jantung": {
      "lastSeen": 1693920000000,
      "status": "online",
      "firmware": "1.0.0",
      "batteryLevel": 85
    }
  }
}
```

**Real-time Subscription:**
```javascript
// Frontend Firebase listener
import { ref, onValue } from 'firebase/database';

const sensorDataRef = ref(database, 'sensorData');
onValue(sensorDataRef, (snapshot) => {
  const data = snapshot.val();
  // Process new sensor data
  updateDashboard(data);
});
```

---

## 🚀 Deployment

### 🌐 Production Deployment

**Environment Setup:**
```bash
# Production environment variables
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-host:5432/db
FIREBASE_PROJECT_ID=iot-heart-monitor-prod

# Build for production  
npm run build

# Start production server
npm start
```

**Docker Deployment:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

**Database Migration:**
```bash
# Production database setup
npm run db:push --env=production

# Backup strategy
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### ☁️ Cloud Deployment Options

**Option 1: Replit (Recommended for Development)**
- Auto-deployment dari Git repository  
- Built-in PostgreSQL database
- Environment variables management
- Custom domain support

**Option 2: Vercel + Neon**
- Frontend: Vercel deployment
- Database: Neon PostgreSQL 
- Serverless functions untuk API
- Automatic HTTPS dan CDN

**Option 3: DigitalOcean App Platform**
- Full-stack deployment
- Managed PostgreSQL
- Auto-scaling capabilities
- Load balancer integration

---

## 🤝 Contributing

### 📋 Development Guidelines

**Code Standards:**
- TypeScript untuk type safety
- ESLint + Prettier untuk code formatting
- Conventional commits untuk Git messages
- Component-driven development

**Folder Structure:**
```
iot-heart-monitoring/
├── client/src/
│   ├── components/         # Reusable UI components
│   ├── pages/             # Route components  
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities dan configurations
│   └── types/             # TypeScript type definitions
├── server/
│   ├── routes.ts          # API route handlers
│   ├── db.ts              # Database connection
│   └── storage.ts         # Data access layer
├── shared/
│   └── schema.ts          # Shared data schemas
└── Arduino/
    └── ESP32_Medical_Indonesia_Final.ino
```

**Git Workflow:**
```bash
# Feature development
git checkout -b feature/new-sensor-integration
git commit -m "feat: add blood glucose sensor support"
git push origin feature/new-sensor-integration

# Create Pull Request
# Code review dan testing
# Merge to main branch
```

### 🧪 Testing Strategy

**Unit Testing:**
```bash
# Run unit tests
npm test

# Test coverage
npm run test:coverage

# Integration tests  
npm run test:integration
```

**Hardware Testing:**
- Sensor accuracy validation
- Signal quality assessment
- Long-term stability testing
- Power consumption measurement

**End-to-End Testing:**
```bash
# E2E test dengan Cypress
npm run test:e2e

# Performance testing
npm run test:performance
```

---

## 📞 Support & Contact

### 🆘 Getting Help

**Documentation:**
- README.md (this file)
- API documentation di `/api/docs`
- Component Storybook di `/storybook`

**Community Support:**
- GitHub Issues untuk bug reports
- Discussions untuk feature requests  
- Discord server untuk real-time help

**Professional Support:**
- Email: [your-email@domain.com]
- LinkedIn: [your-linkedin-profile]
- Research collaboration welcome

### 🐛 Reporting Issues

**Bug Report Template:**
```markdown
## Bug Description
Brief description of the bug

## Steps to Reproduce  
1. Step one
2. Step two  
3. Step three

## Expected Behavior
What should happen

## Actual Behavior  
What actually happened

## Environment
- OS: [e.g. Windows 10, macOS Big Sur]
- Browser: [e.g. Chrome 91, Firefox 89]  
- Node.js version: [e.g. 18.16.0]
- Hardware: [ESP32 DevKit v1, MAX30105, etc.]

## Additional Context
Screenshots, logs, etc.
```

---

## 📜 License & Citation

### 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### 📖 Citation
If you use this project in your research, please cite:

```bibtex
@thesis{iot_heart_monitoring_2024,
  title={Penerapan Internet of Things dalam Identifikasi Dini dan Monitoring Kondisi Jantung Secara Real-Time},
  author={[Your Name]},
  year={2024},
  school={[Your University]},
  type={Bachelor's Thesis},
  url={https://github.com/[your-username]/iot-heart-monitoring}
}
```

### 🙏 Acknowledgments
- SparkFun untuk MAX30105 library
- Adafruit untuk MLX90614 library  
- Firebase team untuk real-time database
- React dan TypeScript communities
- Medical professionals untuk validation guidance

---

## 📊 Project Status

**Current Version:** 1.0.0  
**Development Status:** Active Development  
**Last Updated:** September 2024

**Roadmap:**
- ✅ Basic IoT sensor integration
- ✅ Real-time web dashboard  
- ✅ Machine learning classification
- ✅ Research evaluation tools
- 🔄 Medical validation study
- 📋 Mobile app development
- 📋 Advanced ML algorithms (LSTM, CNN)
- 📋 Multi-device sensor fusion

**Known Limitations:**
- ESP32 power consumption optimization needed
- Medical validation dengan sample size terbatas  
- Classification model perlu more diverse dataset
- Real-time latency bisa improved untuk critical alerts

---

**🎯 Quick Start Summary:**
1. Clone repo → `npm install` → Setup Firebase → Configure ESP32
2. Upload Arduino code → Connect sensors → Run `npm run dev`  
3. Open `http://localhost:5000/dashboard` → Test real-time data
4. Use `/training` untuk model management → `/evaluation` untuk metrics
5. Follow research protocol di `/data-collection` untuk thesis data

**Happy Monitoring! 💓📊🚀**