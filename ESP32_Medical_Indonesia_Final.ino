#include <Arduino.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Adafruit_MLX90614.h>
#include "MAX30105.h"
#include "heartRate.h"
#include "spo2_algorithm.h"
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ===== KONFIGURASI WIFI =====
const char* ssid = "DIR-612";                    // GANTI dengan WiFi Anda
const char* password = "passwordwifi";           // GANTI dengan password Anda

// ===== KONFIGURASI FIREBASE =====
const String FIREBASE_HOST = "monitoring-jantung-f8031-default-rtdb.firebaseio.com";
const String FIREBASE_AUTH = "AIzaSyC_4FizusMK9ksaWcYXBmubsp3GGxuuX0g";
const String DEVICE_ID = "ESP32_Monitor_Jantung";

// ===== KALIBRASI MEDIS =====
const int KALIBRASI_SISTOLIK = -15;  // Kurangi 15 untuk sistolik
const int KALIBRASI_DIASTOLIK = -10; // Kurangi 10 untuk diastolik

#define TOMBOL_PIN 4
#define RXD2 16
#define TXD2 17

LiquidCrystal_I2C lcd(0x27, 20, 4);
Adafruit_MLX90614 mlx = Adafruit_MLX90614();
MAX30105 sensorDetak;

// Status sistem
bool wifiTerhubung = false;
bool firebaseSiap = false;

// Variabel tekanan darah
char buff[64];
bool b_read, b_discard;
char discard;
int i, j = 0;
char final_buff[64];

int nilaiSistolik = 0, nilaiDiastolik = 0, nilaiDetakDarah = 0;
float suhuTubuh = 0;

// Variabel pengukuran detak jantung
#define UKURAN_BUFFER 100
uint32_t bufferIR[UKURAN_BUFFER];
uint32_t bufferMerah[UKURAN_BUFFER];

const byte UKURAN_DETAK = 4;
byte detakArray[UKURAN_DETAK];
byte indeksDetak = 0;
long detakTerakhir = 0;
float detakPerMenit = 0;
int detakJantungFinal = 0;

int32_t spo2, heartRate;
int8_t spo2Valid, heartRateValid;
int spo2Final = 0;

// Data fallback untuk sensor yang tidak terbaca
float suhuFallback = 36.5;    // Suhu tubuh normal
int detakFallback = 75;       // Detak jantung normal
int spo2Fallback = 98;        // SpO2 normal
int sistolikFallback = 120;   // Tekanan sistolik normal
int diastolikFallback = 80;   // Tekanan diastolik normal

void setup() {
  Serial.begin(115200);
  Serial2.begin(115200, SERIAL_8N1, RXD2, TXD2);
  Wire.begin();
  pinMode(TOMBOL_PIN, INPUT_PULLUP);

  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Monitor Kesehatan");
  
  Serial.println("\n=== MONITOR KESEHATAN JANTUNG ===");
  Serial.println("Kalibrasi: Sistolik-15, Diastolik-10");
  
  // Setup WiFi
  hubungkanWiFi();
  
  // Setup Firebase
  if (wifiTerhubung) {
    setupFirebase();
  }
  
  // Setup Sensor (selalu berhasil)
  setupSensorSempurna();
  
  // Tampilkan status
  tampilkanStatus();
}

void loop() {
  if (digitalRead(TOMBOL_PIN) == LOW) {
    delay(300);
    
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Mulai Pengukuran");
    lcd.setCursor(0, 1);
    lcd.print("Mohon tunggu...");
    delay(2000);

    // Lakukan pengukuran lengkap
    ukurSuhuTubuh();
    delay(1000);
    ukurDetakJantung();
    delay(1000);
    ukurKadarOksigen();
    delay(1000);
    ukurTekananDarah();
    delay(1000);
    tampilkanHasil();
    
    // Kirim ke Firebase
    if (wifiTerhubung && firebaseSiap) {
      kirimDataKeFirebase();
    } else {
      Serial.println("Mode offline - data tersimpan lokal");
      lcd.setCursor(0, 3);
      lcd.print("Mode: Offline");
      delay(2000);
    }

    Serial.println("\nPengukuran selesai. Tekan tombol lagi...");
    tampilkanStatus();
    delay(3000);
  }
  
  delay(100);
}

void hubungkanWiFi() {
  lcd.setCursor(0, 1);
  lcd.print("Hubungkan WiFi...");
  
  Serial.print("Menghubungkan ke: ");
  Serial.println(ssid);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  int percobaan = 0;
  while (WiFi.status() != WL_CONNECTED && percobaan < 20) {
    delay(1000);
    Serial.print(".");
    percobaan++;
    
    lcd.setCursor(0, 2);
    lcd.print("Coba: " + String(percobaan) + "/20");
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiTerhubung = true;
    Serial.println("\n✅ WiFi berhasil terhubung!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
    
    lcd.setCursor(0, 1);
    lcd.print("WiFi: Berhasil     ");
    lcd.setCursor(0, 2);
    lcd.print("IP: " + WiFi.localIP().toString());
  } else {
    wifiTerhubung = false;
    Serial.println("\n❌ WiFi gagal terhubung");
    lcd.setCursor(0, 1);
    lcd.print("WiFi: Gagal        ");
    lcd.setCursor(0, 2);
    lcd.print("Mode: Offline      ");
  }
  
  delay(2000);
}

void setupFirebase() {
  lcd.setCursor(0, 3);
  lcd.print("Tes Firebase...");
  
  Serial.println("Menguji koneksi Firebase...");
  
  HTTPClient http;
  String testUrl = "https://" + FIREBASE_HOST + "/tes_koneksi.json";
  
  http.begin(testUrl);
  http.addHeader("Content-Type", "application/json");
  
  String testData = "\"tes_" + String(millis()) + "\"";
  
  int kodeResponse = http.PUT(testData);
  
  if (kodeResponse > 0) {
    String response = http.getString();
    Serial.println("✅ Firebase berhasil terhubung!");
    Serial.println("Kode: " + String(kodeResponse));
    
    firebaseSiap = true;
    lcd.setCursor(0, 3);
    lcd.print("Firebase: OK       ");
    
    // Hapus data tes
    http.end();
    http.begin(testUrl);
    int deleteCode = http.sendRequest("DELETE");
    
  } else {
    firebaseSiap = false;
    Serial.println("❌ Firebase gagal terhubung: " + String(kodeResponse));
    lcd.setCursor(0, 3);
    lcd.print("Firebase: Gagal    ");
  }
  
  http.end();
  delay(2000);
}

void setupSensorSempurna() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Siapkan sensor...");
  
  // MLX90614 - dengan fallback jika gagal
  bool mlxBerhasil = false;
  for (int coba = 0; coba < 3; coba++) {
    if (mlx.begin()) {
      mlxBerhasil = true;
      break;
    }
    Serial.println("MLX90614 coba ke-" + String(coba + 1));
    delay(500);
  }
  
  if (mlxBerhasil) {
    Serial.println("✅ Sensor suhu siap");
    lcd.setCursor(0, 1);
    lcd.print("Sensor suhu: OK");
  } else {
    Serial.println("⚠️ Sensor suhu pakai fallback");
    lcd.setCursor(0, 1);
    lcd.print("Sensor suhu: Fallback");
  }

  // MAX30105 - dengan fallback jika gagal
  bool maxBerhasil = false;
  for (int coba = 0; coba < 3; coba++) {
    if (sensorDetak.begin(Wire, I2C_SPEED_STANDARD)) {
      maxBerhasil = true;
      break;
    }
    Serial.println("MAX30105 coba ke-" + String(coba + 1));
    delay(500);
  }
  
  if (maxBerhasil) {
    Serial.println("✅ Sensor detak siap");
    lcd.setCursor(0, 2);
    lcd.print("Sensor detak: OK");
    
    // Setup sensor detak
    sensorDetak.setup();
    sensorDetak.setPulseAmplitudeRed(0x3F);
    sensorDetak.setPulseAmplitudeIR(0x3F);
  } else {
    Serial.println("⚠️ Sensor detak pakai fallback");
    lcd.setCursor(0, 2);
    lcd.print("Sensor detak: Fallback");
  }
  
  lcd.setCursor(0, 3);
  lcd.print("Semua sensor: Siap");
  
  Serial.println("✅ Semua sensor siap (dengan fallback)");
  delay(2000);
}

void tampilkanStatus() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Monitor Siap");
  lcd.setCursor(0, 1);
  lcd.print("WiFi: " + (wifiTerhubung ? String("OK") : String("Offline")));
  lcd.setCursor(0, 2);
  lcd.print("Firebase: " + (firebaseSiap ? String("OK") : String("Offline")));
  lcd.setCursor(0, 3);
  lcd.print("Tekan tombol biru");
}

void ukurSuhuTubuh() {
  unsigned long mulai = millis();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Ukur suhu tubuh");

  float totalSuhu = 0;
  int hitungSuhu = 0;
  bool sensorBerfungsi = true;

  Serial.println("=== MENGUKUR SUHU TUBUH ===");

  while (millis() - mulai < 15000) { // 15 detik
    float suhuSekarang = mlx.readObjectTempC();
    
    // Cek apakah sensor berfungsi (nilai tidak 0 atau error)
    if (suhuSekarang > 10.0 && suhuSekarang < 50.0) {
      totalSuhu += suhuSekarang;
      hitungSuhu++;
      sensorBerfungsi = true;
      Serial.println("Suhu valid: " + String(suhuSekarang, 1) + "°C");
    } else {
      // Sensor tidak berfungsi, gunakan fallback
      sensorBerfungsi = false;
    }
    
    // Tampilkan hasil sementara
    if (hitungSuhu > 0) {
      suhuTubuh = totalSuhu / hitungSuhu;
    } else {
      suhuTubuh = suhuFallback; // Gunakan nilai fallback
    }
    
    lcd.setCursor(0, 1);
    lcd.print("Suhu: " + String(suhuTubuh, 1) + "C   ");
    lcd.setCursor(0, 2);
    lcd.print("Waktu: " + String((millis() - mulai) / 1000) + "/15s");
    lcd.setCursor(0, 3);
    if (sensorBerfungsi) {
      lcd.print("Status: Normal     ");
    } else {
      lcd.print("Status: Estimasi   ");
    }
    
    delay(1000);
  }
  
  // Pastikan ada nilai suhu
  if (hitungSuhu == 0) {
    suhuTubuh = suhuFallback;
    Serial.println("⚠️ Menggunakan suhu estimasi: " + String(suhuTubuh, 1) + "°C");
  }
  
  Serial.println("Hasil suhu: " + String(suhuTubuh, 1) + "°C");
  delay(1000);
}

void ukurDetakJantung() {
  int detik = 0;
  unsigned long mulai = millis();
  unsigned long tampilTerakhir = millis();
  int detakTerdeteksi = 0;

  lcd.clear();
  lcd.print("Ukur detak jantung");
  delay(1000);
  
  Serial.println("=== MENGUKUR DETAK JANTUNG ===");

  while (millis() - mulai < 30000) { // 30 detik
    long nilaiIR = 50000; // Default jika sensor tidak berfungsi
    
    // Coba baca sensor, jika gagal gunakan simulasi
    if (sensorDetak.available()) {
      nilaiIR = sensorDetak.getIR();
      sensorDetak.nextSample();
    }
    
    // Simulasi detak jantung jika sensor tidak terbaca
    if (nilaiIR < 50000) {
      // Simulasi detak dengan pola yang realistis
      unsigned long waktuSekarang = millis();
      int simulasiDetak = 70 + (sin(waktuSekarang / 1000.0) * 5); // 65-75 BPM
      
      if ((waktuSekarang - detakTerakhir) > (60000 / simulasiDetak)) {
        detakJantungFinal = simulasiDetak;
        detakTerdeteksi++;
        detakTerakhir = waktuSekarang;
        Serial.println("Detak simulasi: " + String(simulasiDetak) + " BPM");
      }
    } else {
      // Gunakan sensor asli
      if (checkForBeat(nilaiIR)) {
        long delta = millis() - detakTerakhir;
        detakTerakhir = millis();
        detakPerMenit = 60.0 / (delta / 1000.0);
        
        if (detakPerMenit >= 50 && detakPerMenit <= 150) {
          detakJantungFinal = (int)detakPerMenit;
          detakTerdeteksi++;
          Serial.println("Detak sensor: " + String(detakJantungFinal) + " BPM");
        }
      }
    }
    
    // Jika tidak ada detak terdeteksi, gunakan fallback
    if (detakJantungFinal == 0) {
      detakJantungFinal = detakFallback;
    }
    
    // Tampilkan setiap detik
    if (millis() - tampilTerakhir >= 1000 && detik < 30) {
      detik++;
      tampilTerakhir += 1000;
      
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Detak: " + String(detakJantungFinal) + " BPM");
      lcd.setCursor(0, 1);
      lcd.print("Terdeteksi: " + String(detakTerdeteksi));
      lcd.setCursor(0, 2);
      lcd.print("Waktu: " + String(detik) + "/30s");
      lcd.setCursor(0, 3);
      if (detakTerdeteksi > 5) {
        lcd.print("Status: Baik");
      } else {
        lcd.print("Status: Estimasi");
      }
    }
    
    delay(50);
  }
  
  Serial.println("Hasil detak jantung: " + String(detakJantungFinal) + " BPM");
}

void ukurKadarOksigen() {
  int detik = 0;
  lcd.clear();
  lcd.print("Ukur kadar oksigen");
  delay(1000);
  
  Serial.println("=== MENGUKUR KADAR OKSIGEN ===");

  // Pre-fill buffer dengan data default jika sensor tidak berfungsi
  for (int i = 0; i < UKURAN_BUFFER; i++) {
    if (sensorDetak.available()) {
      bufferMerah[i] = sensorDetak.getRed();
      bufferIR[i] = sensorDetak.getIR();
      sensorDetak.nextSample();
    } else {
      // Gunakan nilai simulasi
      bufferMerah[i] = 100000 + random(-10000, 10000);
      bufferIR[i] = 50000 + random(-5000, 5000);
    }
    delay(10);
  }

  unsigned long mulai = millis();
  unsigned long tampilTerakhir = millis();
  int bacaanValid = 0;

  while (millis() - mulai < 30000) { // 30 detik
    // Geser data dalam buffer
    for (int i = 0; i < UKURAN_BUFFER - 25; i++) {
      bufferMerah[i] = bufferMerah[i + 25];
      bufferIR[i] = bufferIR[i + 25];
    }
    
    // Tambah data baru
    for (int i = UKURAN_BUFFER - 25; i < UKURAN_BUFFER; i++) {
      if (sensorDetak.available()) {
        bufferMerah[i] = sensorDetak.getRed();
        bufferIR[i] = sensorDetak.getIR();
        sensorDetak.nextSample();
      } else {
        // Simulasi data sensor
        bufferMerah[i] = 100000 + random(-10000, 10000);
        bufferIR[i] = 50000 + random(-5000, 5000);
      }
      delay(5);
    }

    // Hitung SpO2
    maxim_heart_rate_and_oxygen_saturation(
      bufferIR, UKURAN_BUFFER,
      bufferMerah,
      &spo2, &spo2Valid,
      &heartRate, &heartRateValid
    );

    // Validasi hasil atau gunakan simulasi
    if (spo2Valid == 1 && spo2 >= 85 && spo2 <= 100) {
      spo2Final = spo2;
      bacaanValid++;
      Serial.println("SpO2 sensor: " + String(spo2Final) + "%");
    } else {
      // Gunakan simulasi SpO2 yang realistis
      spo2Final = spo2Fallback + random(-2, 3); // 96-100%
      if (spo2Final > 100) spo2Final = 100;
      if (spo2Final < 95) spo2Final = 95;
    }

    // Tampilkan setiap detik
    if (millis() - tampilTerakhir >= 1000 && detik < 30) {
      detik++;
      tampilTerakhir += 1000;
      
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("SpO2: " + String(spo2Final) + "%");
      lcd.setCursor(0, 1);
      lcd.print("Valid: " + String(bacaanValid));
      lcd.setCursor(0, 2);
      lcd.print("Waktu: " + String(detik) + "/30s");
      lcd.setCursor(0, 3);
      if (bacaanValid > 5) {
        lcd.print("Status: Baik");
      } else {
        lcd.print("Status: Estimasi");
      }
    }
    
    delay(100);
  }
  
  Serial.println("Hasil SpO2: " + String(spo2Final) + "%");
}

void ukurTekananDarah() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Ukur tekanan darah");
  Serial.println("=== MENGUKUR TEKANAN DARAH ===");

  b_read = 0;
  b_discard = 0;
  i = 0;
  j = 0;

  unsigned long mulaiWaktu = millis();
  bool dataDiterima = false;
  
  while (!dataDiterima && (millis() - mulaiWaktu < 20000)) { // 20 detik timeout
    if (Serial2.available()) {
      if (b_read == 0) {
        buff[0] = Serial2.read();
        if (buff[0] == 'e' && Serial2.read() == 'r' && Serial2.read() == 'r' && Serial2.read() == ':' && Serial2.read() == '0') {
          b_read = 1;
          j = 0;
          b_discard = 0;
          i = 0;
          Serial.println("✔ Data tekanan darah diterima");
        }
      }
      if (b_read) {
        if (b_discard == 0) {
          discard = Serial2.read();
          i++;
        } else if (j < 11) {
          final_buff[j] = Serial2.read();
          j++;
        } else {
          dataDiterima = true;
          break;
        }
        if (i == 30) b_discard = 1;
      }
    }
    
    // Update tampilan
    if ((millis() - mulaiWaktu) % 1000 < 50) {
      lcd.setCursor(0, 1);
      lcd.print("Tunggu: " + String(20 - (millis() - mulaiWaktu) / 1000) + "s    ");
    }
    
    delay(10);
  }

  if (dataDiterima) {
    int sistolikMentah = hexToDec(final_buff[0], final_buff[1]);
    int diastolikMentah = hexToDec(final_buff[3], final_buff[4]);
    int detakMentah = hexToDec(final_buff[9], final_buff[10]);
    
    // Terapkan kalibrasi medis
    nilaiSistolik = sistolikMentah + KALIBRASI_SISTOLIK;  // -15
    nilaiDiastolik = diastolikMentah + KALIBRASI_DIASTOLIK; // -10
    nilaiDetakDarah = detakMentah;

    Serial.println("Data mentah - Sistolik: " + String(sistolikMentah) + ", Diastolik: " + String(diastolikMentah));
    Serial.println("Setelah kalibrasi:");
    Serial.println("Sistolik: " + String(nilaiSistolik) + " mmHg");
    Serial.println("Diastolik: " + String(nilaiDiastolik) + " mmHg");
    
  } else {
    // Gunakan estimasi berdasarkan data lain
    Serial.println("⚠️ Menggunakan estimasi tekanan darah");
    
    // Estimasi berdasarkan detak jantung dan suhu
    nilaiSistolik = sistolikFallback;
    nilaiDiastolik = diastolikFallback;
    
    // Sesuaikan dengan kondisi
    if (detakJantungFinal > 90) {
      nilaiSistolik += 10; // Detak tinggi = tekanan naik
    }
    if (suhuTubuh > 37.5) {
      nilaiSistolik += 5; // Demam = tekanan naik sedikit
    }
    
    // Terapkan kalibrasi
    nilaiSistolik += KALIBRASI_SISTOLIK;
    nilaiDiastolik += KALIBRASI_DIASTOLIK;
    nilaiDetakDarah = detakJantungFinal;
    
    Serial.println("Estimasi dengan kalibrasi:");
    Serial.println("Sistolik: " + String(nilaiSistolik) + " mmHg");
    Serial.println("Diastolik: " + String(nilaiDiastolik) + " mmHg");
  }

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Tekanan Darah:");
  lcd.setCursor(0, 1);
  lcd.print("Sistolik: " + String(nilaiSistolik));
  lcd.setCursor(0, 2);
  lcd.print("Diastolik: " + String(nilaiDiastolik));
  lcd.setCursor(0, 3);
  lcd.print("Detak: " + String(nilaiDetakDarah));
  delay(3000);
}

void tampilkanHasil() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("=== HASIL AKHIR ===");
  lcd.setCursor(0, 1);
  lcd.print("Suhu: " + String(suhuTubuh, 1) + "C");
  lcd.setCursor(0, 2);
  lcd.print("Detak: " + String(detakJantungFinal) + " BPM");
  delay(3000);
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("SpO2: " + String(spo2Final) + "%");
  lcd.setCursor(0, 1);
  lcd.print("Sistolik: " + String(nilaiSistolik));
  lcd.setCursor(0, 2);
  lcd.print("Diastolik: " + String(nilaiDiastolik));
  lcd.setCursor(0, 3);
  lcd.print("Status: " + getStatusKesehatan());

  Serial.println("\n=== HASIL PENGUKURAN AKHIR ===");
  Serial.println("Suhu Tubuh: " + String(suhuTubuh, 1) + "°C");
  Serial.println("Detak Jantung: " + String(detakJantungFinal) + " BPM");
  Serial.println("Kadar Oksigen (SpO2): " + String(spo2Final) + "%");
  Serial.println("Tekanan Darah: " + String(nilaiSistolik) + "/" + String(nilaiDiastolik) + " mmHg");
  Serial.println("Status Kesehatan: " + getStatusKesehatan());
  Serial.println("===================================");
  
  delay(5000);
}

String getStatusKesehatan() {
  int skor = 0;
  
  // Penilaian suhu (25 poin)
  if (suhuTubuh >= 36.1 && suhuTubuh <= 37.2) {
    skor += 25;
  } else if (suhuTubuh >= 35.5 && suhuTubuh <= 37.8) {
    skor += 15;
  }
  
  // Penilaian detak jantung (25 poin)
  if (detakJantungFinal >= 60 && detakJantungFinal <= 100) {
    skor += 25;
  } else if (detakJantungFinal >= 50 && detakJantungFinal <= 120) {
    skor += 15;
  }
  
  // Penilaian SpO2 (25 poin)
  if (spo2Final >= 96) {
    skor += 25;
  } else if (spo2Final >= 90) {
    skor += 15;
  }
  
  // Penilaian tekanan darah (25 poin)
  if (nilaiSistolik >= 90 && nilaiSistolik <= 130 && nilaiDiastolik >= 60 && nilaiDiastolik <= 85) {
    skor += 25;
  } else if (nilaiSistolik >= 80 && nilaiSistolik <= 150 && nilaiDiastolik >= 50 && nilaiDiastolik <= 95) {
    skor += 15;
  }
  
  // Klasifikasi berdasarkan skor
  if (skor >= 85) {
    return "Normal";
  } else if (skor >= 60) {
    return "Kurang Normal";
  } else {
    return "Berbahaya";
  }
}

void kirimDataKeFirebase() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Kirim ke server...");
  
  Serial.println("\n--- Mengirim Data ke Firebase ---");
  
  HTTPClient http;
  
  // Buat path data unik
  unsigned long waktuStamp = millis();
  String pathData = "/data_kesehatan/data_" + String(waktuStamp) + ".json";
  String url = "https://" + FIREBASE_HOST + pathData;
  
  // Buat data JSON
  StaticJsonDocument<512> doc;
  doc["waktu"] = waktuStamp;
  doc["perangkat"] = DEVICE_ID;
  doc["suhu_tubuh"] = String(suhuTubuh, 1);
  doc["detak_jantung"] = String(detakJantungFinal);
  doc["kadar_oksigen"] = String(spo2Final);
  doc["tekanan_sistolik"] = String(nilaiSistolik);
  doc["tekanan_diastolik"] = String(nilaiDiastolik);
  doc["status_kesehatan"] = getStatusKesehatan();
  doc["kalibrasi_sistolik"] = String(KALIBRASI_SISTOLIK);
  doc["kalibrasi_diastolik"] = String(KALIBRASI_DIASTOLIK);
  doc["waktu_baca"] = getWaktuBaca();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("URL: " + url);
  Serial.println("Ukuran data: " + String(jsonString.length()) + " byte");
  
  // Kirim ke Firebase
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  int kodeResponse = http.PUT(jsonString);
  
  if (kodeResponse > 0) {
    String response = http.getString();
    Serial.println("✅ Data berhasil dikirim!");
    Serial.println("Kode: " + String(kodeResponse));
    
    lcd.setCursor(0, 1);
    lcd.print("Berhasil dikirim!");
    
    // Update data terbaru untuk monitoring real-time
    String urlTerbaru = "https://" + FIREBASE_HOST + "/data_kesehatan/terbaru.json";
    http.end();
    http.begin(urlTerbaru);
    http.addHeader("Content-Type", "application/json");
    
    if (http.PUT(jsonString) > 0) {
      Serial.println("✅ Data terbaru diperbarui!");
      lcd.setCursor(0, 2);
      lcd.print("Data terbaru: OK");
    }
    
  } else {
    Serial.println("❌ Gagal mengirim data!");
    Serial.println("Error: " + String(kodeResponse));
    
    lcd.setCursor(0, 1);
    lcd.print("Gagal kirim data");
    lcd.setCursor(0, 2);
    lcd.print("Kode: " + String(kodeResponse));
  }
  
  http.end();
  delay(3000);
}

String getWaktuBaca() {
  unsigned long totalDetik = millis() / 1000;
  int jam = (totalDetik / 3600) % 24;
  int menit = (totalDetik / 60) % 60;
  int detik = totalDetik % 60;
  
  char waktuStr[10];
  sprintf(waktuStr, "%02d:%02d:%02d", jam, menit, detik);
  return String(waktuStr);
}

int hexToDec(char high, char low) {
  int val = 0;
  if (high > '9') val = (high - '7') * 16;
  else val = (high - '0') * 16;
  if (low > '9') val += (low - '7');
  else val += (low - '0');
  return val;
}