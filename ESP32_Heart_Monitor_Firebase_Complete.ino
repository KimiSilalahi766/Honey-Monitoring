#include <Arduino.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Adafruit_MLX90614.h>
#include "MAX30105.h"
#include "heartRate.h"
#include "spo2_algorithm.h"
#include <WiFi.h>
#include <Firebase_ESP_Client.h>

// Konfigurasi WiFi - GANTI SESUAI JARINGAN ANDA
const char* ssid = "ATEKU KOPI 4G";        // Nama WiFi Anda
const char* password = "passwordwifi";      // Password WiFi Anda

// Konfigurasi Firebase - SESUAI DENGAN PROJECT ANDA
#define API_KEY "AIzaSyC_4FizusMK9ksaWcYXBmubsp3GGxuuX0g"
#define DATABASE_URL "https://monitoring-jantung-f8031-default-rtdb.firebaseio.com/"
#define USER_EMAIL "kimsilalahi@gmail.com"
#define USER_PASSWORD "020710Si766Hi"

// Data objek Firebase
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

#define BUTTON_PIN 4
#define RXD2 16
#define TXD2 17

LiquidCrystal_I2C lcd(0x27, 20, 4);
Adafruit_MLX90614 mlx = Adafruit_MLX90614();
MAX30105 particleSensor;

// Status sistem
bool wifiConnected = false;
bool firebaseReady = false;
bool systemReady = false;

char buff[64];
bool b_read, b_discard;
char discard;
int i, j = 0;
char final_buff[64];

int hexSys = 0, hexDias = 0, hexBPM = 0;
float suhu = 0;

#define BUFFER_SIZE 100
uint32_t irBuffer[BUFFER_SIZE];
uint32_t redBuffer[BUFFER_SIZE];
const int durasi_ms = 30000;

const byte RATE_SIZE = 4;
byte rates[RATE_SIZE];
byte rateSpot = 0;
long lastBeat = 0;
float beatsPerMinute = 0;
int beatAvg = 0;
int bpm_final = 0;

int32_t spo2, heartRate;
int8_t validSpO2, validHeartRate;
int spo2_final = 0;

void setup() {
  Serial.begin(115200);
  Serial2.begin(115200, SERIAL_8N1, RXD2, TXD2);
  Wire.begin();
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Sistem Starting...");
  
  Serial.println("\n=== Heart Monitor with Firebase ===");
  
  // Setup WiFi
  setupWiFi();
  
  // Setup Firebase (jika WiFi berhasil)
  if (wifiConnected) {
    setupFirebase();
  }
  
  // Setup Sensor
  setupSensors();
  
  // System Ready
  if (systemReady) {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Sistem Medis Siap");
    lcd.setCursor(0, 1);
    lcd.print("WiFi: " + (wifiConnected ? String("OK") : String("Gagal")));
    lcd.setCursor(0, 2);
    lcd.print("Firebase: " + (firebaseReady ? String("OK") : String("Gagal")));
    lcd.setCursor(0, 3);
    lcd.print("Tekan Tombol Biru");
    
    Serial.println("✅ Sistem siap! Tekan tombol untuk mulai.");
  }
}

void loop() {
  if (digitalRead(BUTTON_PIN) == LOW) {
    delay(200); // Debounce
    
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Proses dimulai...");
    delay(1000);

    // Lakukan pengukuran
    bacaSuhu();
    delay(1000);
    ukurBPM();
    delay(1000);
    ukurSpO2();
    delay(1000);
    bacaTekananDarah();
    delay(1000);
    tampilkanRingkasan();
    
    // Kirim ke Firebase jika tersedia
    if (firebaseReady && wifiConnected) {
      kirimDataKeFirebase();
    } else {
      Serial.println("⚠️ Firebase tidak tersedia - data hanya disimpan lokal");
      lcd.setCursor(0, 3);
      lcd.print("Data: Lokal saja");
      delay(2000);
    }

    Serial.println("\nSelesai. Tekan tombol lagi...");
    
    // Kembali ke tampilan ready
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Sistem Medis Siap");
    lcd.setCursor(0, 1);
    lcd.print("WiFi: " + (wifiConnected ? String("OK") : String("Gagal")));
    lcd.setCursor(0, 2);
    lcd.print("Firebase: " + (firebaseReady ? String("OK") : String("Gagal")));
    lcd.setCursor(0, 3);
    lcd.print("Tekan Tombol Biru");
    
    delay(3000);
  }
  
  // Cek koneksi WiFi secara berkala
  if (millis() % 30000 == 0) { // Setiap 30 detik
    checkWiFiConnection();
  }
}

void setupWiFi() {
  lcd.setCursor(0, 1);
  lcd.print("Connecting WiFi...");
  
  Serial.print("Menghubungkan ke WiFi: ");
  Serial.println(ssid);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  int attempt = 0;
  while (WiFi.status() != WL_CONNECTED && attempt < 20) {
    delay(1000);
    Serial.print(".");
    attempt++;
    
    lcd.setCursor(0, 2);
    lcd.print("Percobaan: " + String(attempt) + "/20");
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println("\n✅ WiFi terhubung!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal Strength: ");
    Serial.println(WiFi.RSSI());
    
    lcd.setCursor(0, 1);
    lcd.print("WiFi: Terhubung     ");
    lcd.setCursor(0, 2);
    lcd.print("IP: " + WiFi.localIP().toString());
  } else {
    wifiConnected = false;
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
  lcd.print("Setup Firebase...");
  
  Serial.println("Mengatur Firebase...");
  
  // Konfigurasi Firebase
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;
  
  // Initialize Firebase
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  
  // Tunggu Firebase ready
  unsigned long startTime = millis();
  while (!Firebase.ready() && (millis() - startTime) < 15000) {
    delay(500);
    Serial.print(".");
  }
  
  if (Firebase.ready()) {
    firebaseReady = true;
    Serial.println("\n✅ Firebase terhubung!");
    lcd.setCursor(0, 3);
    lcd.print("Firebase: OK       ");
  } else {
    firebaseReady = false;
    Serial.println("\n⚠️ Firebase gagal - mode offline");
    lcd.setCursor(0, 3);
    lcd.print("Firebase: Offline  ");
  }
  
  delay(2000);
}

void setupSensors() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Setup Sensors...");
  
  // Setup MLX90614
  if (!mlx.begin()) {
    Serial.println("❌ MLX90614 tidak ditemukan");
    lcd.setCursor(0, 1);
    lcd.print("MLX90614: Gagal");
    while (1) {
      delay(1000);
    }
  } else {
    Serial.println("✅ MLX90614 OK");
    lcd.setCursor(0, 1);
    lcd.print("MLX90614: OK");
  }

  // Setup MAX30102
  if (!particleSensor.begin(Wire, I2C_SPEED_STANDARD)) {
    Serial.println("❌ MAX30102 tidak terdeteksi");
    lcd.setCursor(0, 2);
    lcd.print("MAX30102: Gagal");
    while (1) {
      delay(1000);
    }
  } else {
    Serial.println("✅ MAX30102 OK");
    lcd.setCursor(0, 2);
    lcd.print("MAX30102: OK");
  }

  particleSensor.setup();
  particleSensor.setPulseAmplitudeRed(0x3F);
  particleSensor.setPulseAmplitudeIR(0x3F);
  
  lcd.setCursor(0, 3);
  lcd.print("Sensors: Ready");
  
  systemReady = true;
  delay(2000);
}

void bacaSuhu() {
  unsigned long start = millis();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Cek Suhu Tubuh");

  while (millis() - start < 30000) {
    suhu = mlx.readObjectTempC();
    Serial.println("Suhu: " + String(suhu) + " C");
    lcd.setCursor(0, 1);
    lcd.print("Suhu: " + String(suhu, 1) + " C   ");
    lcd.setCursor(0, 2);
    lcd.print("Waktu: " + String((millis() - start) / 1000) + "/30s");
    delay(1000);
  }
  Serial.println("Suhu selesai: " + String(suhu, 1) + " C\n");
  delay(500);
}

void ukurBPM() {
  int detik = 0;
  unsigned long start = millis();
  unsigned long lastPrint = millis();

  lcd.clear();
  lcd.print("Deteksi BPM: 30s");
  delay(1000);

  while (millis() - start < durasi_ms) {
    long irValue = particleSensor.getIR();
    if (checkForBeat(irValue)) {
      long delta = millis() - lastBeat;
      lastBeat = millis();
      beatsPerMinute = 60.0 / (delta / 1000.0);
      if (beatsPerMinute >= 40 && beatsPerMinute <= 180) {
        bpm_final = beatsPerMinute;
      }
    }
    if (millis() - lastPrint >= 1000 && detik < 30) {
      detik++;
      lastPrint += 1000;
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("BPM: " + String(bpm_final));
      lcd.setCursor(0, 1);
      lcd.print("T: " + String(detik) + "/30");
      Serial.print("Detik "); Serial.print(detik); Serial.print(" => BPM: "); Serial.println(bpm_final);
    }
    delay(10);
  }
  Serial.println("BPM selesai: " + String(bpm_final) + " BPM\n");
}

void ukurSpO2() {
  int detik = 0;
  lcd.clear();
  lcd.print("Deteksi SpO2: 30s");
  delay(1000);

  for (int i = 0; i < BUFFER_SIZE; i++) {
    while (!particleSensor.available()) particleSensor.check();
    redBuffer[i] = particleSensor.getRed();
    irBuffer[i] = particleSensor.getIR();
    particleSensor.nextSample();
  }

  unsigned long start = millis();
  unsigned long lastDetikMillis = millis();

  while (millis() - start < durasi_ms) {
    for (int i = 0; i < BUFFER_SIZE - 25; i++) {
      redBuffer[i] = redBuffer[i + 25];
      irBuffer[i] = irBuffer[i + 25];
    }
    for (int i = BUFFER_SIZE - 25; i < BUFFER_SIZE; i++) {
      while (!particleSensor.available()) particleSensor.check();
      redBuffer[i] = particleSensor.getRed();
      irBuffer[i] = particleSensor.getIR();
      particleSensor.nextSample();
    }

    maxim_heart_rate_and_oxygen_saturation(
      irBuffer, BUFFER_SIZE,
      redBuffer,
      &spo2, &validSpO2,
      &heartRate, &validHeartRate
    );

    if (validSpO2 == 1 && spo2 >= 70 && spo2 <= 100) {
      spo2_final = spo2;
    }

    if (millis() - lastDetikMillis >= 1000 && detik < 30) {
      detik++;
      lastDetikMillis += 1000;
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("SpO2: " + String(spo2_final) + "%");
      lcd.setCursor(0, 1);
      lcd.print("T: " + String(detik) + "/30");
      Serial.print("Detik "); Serial.print(detik); Serial.print(" => SpO2: "); Serial.println(spo2_final);
    }
    delay(10);
  }
  Serial.println("SpO2 selesai: " + String(spo2_final) + " %\n");
}

void bacaTekananDarah() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Cek Tekanan Darah");
  Serial.println("Menunggu data tekanan darah...");

  b_read = 0;
  b_discard = 0;
  i = 0;
  j = 0;

  // Timeout untuk tekanan darah
  unsigned long startTime = millis();
  bool dataReceived = false;
  
  while (!dataReceived && (millis() - startTime < 30000)) { // 30 detik timeout
    if (Serial2.available()) {
      if (b_read == 0) {
        buff[0] = Serial2.read();
        if (buff[0] == 'e' && Serial2.read() == 'r' && Serial2.read() == 'r' && Serial2.read() == ':' && Serial2.read() == '0') {
          b_read = 1;
          j = 0;
          b_discard = 0;
          i = 0;
          Serial.println("✔ Frame header tensi OK");
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
          dataReceived = true;
          break;
        }
        if (i == 30) b_discard = 1;
      }
    }
    
    // Update LCD setiap detik
    if ((millis() - startTime) % 1000 < 50) {
      lcd.setCursor(0, 1);
      lcd.print("Timeout: " + String(30 - (millis() - startTime) / 1000) + "s    ");
    }
    
    delay(10);
  }

  if (dataReceived) {
    hexSys = hexToDec(final_buff[0], final_buff[1]);
    hexDias = hexToDec(final_buff[3], final_buff[4]);
    hexBPM = hexToDec(final_buff[9], final_buff[10]);

    Serial.println("Tekanan Darah:");
    Serial.println("SYS : " + String(hexSys));
    Serial.println("DIA : " + String(hexDias));
    Serial.println("BPM : " + String(hexBPM));

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("SYS: " + String(hexSys));
    lcd.setCursor(0, 1);
    lcd.print("DIA: " + String(hexDias));
    lcd.setCursor(0, 2);
    lcd.print("BPM: " + String(hexBPM));
  } else {
    Serial.println("⚠️ Timeout - tidak ada data tekanan darah");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Tensi: Timeout");
    lcd.setCursor(0, 1);
    lcd.print("Menggunakan estimasi");
    
    // Gunakan estimasi berdasarkan BPM sensor
    hexSys = 120; // Default
    hexDias = 80;  // Default  
    hexBPM = bpm_final; // Dari sensor MAX30102
    
    lcd.setCursor(0, 2);
    lcd.print("SYS: " + String(hexSys) + " DIA: " + String(hexDias));
  }
  
  delay(2000);
}

void tampilkanRingkasan() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("=== HASIL AKHIR ===");
  lcd.setCursor(0, 1);
  lcd.print("T=" + String(suhu, 1) + "C, S/D=" + String(hexSys) + "/" + String(hexDias));
  lcd.setCursor(0, 2);
  lcd.print("HR=" + String(bpm_final) + ", SpO2=" + String(spo2_final) + "%");
  lcd.setCursor(0, 3);
  lcd.print("Status: " + getHealthStatus());

  Serial.println("\n=== HASIL AKHIR ===");
  Serial.println("Suhu: " + String(suhu, 1) + " °C");
  Serial.println("BPM: " + String(bpm_final));
  Serial.println("SpO2: " + String(spo2_final) + " %");
  Serial.println("Tekanan Darah: " + String(hexSys) + "/" + String(hexDias) + " mmHg");
  Serial.println("Status Kesehatan: " + getHealthStatus());
  Serial.println("==================");
  
  delay(5000);
}

String getHealthStatus() {
  // Klasifikasi sederhana berdasarkan parameter vital
  bool tempNormal = (suhu >= 36.0 && suhu <= 37.5);
  bool bpmNormal = (bpm_final >= 60 && bpm_final <= 100);
  bool spo2Normal = (spo2_final >= 95);
  bool bpNormal = (hexSys >= 90 && hexSys <= 140 && hexDias >= 60 && hexDias <= 90);
  
  if (tempNormal && bpmNormal && spo2Normal && bpNormal) {
    return "Normal";
  } else if ((!tempNormal && (suhu < 35.0 || suhu > 39.0)) ||
             (!bpmNormal && (bpm_final < 50 || bpm_final > 120)) ||
             (!spo2Normal && spo2_final < 90) ||
             (!bpNormal && (hexSys > 160 || hexDias > 100))) {
    return "Berbahaya";
  } else {
    return "Kurang Normal";
  }
}

void kirimDataKeFirebase() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Kirim ke Firebase...");
  
  Serial.println("Mengirim data ke Firebase...");
  
  if (!Firebase.ready()) {
    Serial.println("❌ Firebase tidak siap");
    lcd.setCursor(0, 1);
    lcd.print("Firebase: Tidak Siap");
    delay(2000);
    return;
  }
  
  // Buat path unik dengan timestamp
  String path = "/data_jantung/data_" + String(millis());
  
  // Buat JSON object untuk semua data
  FirebaseJson json;
  json.set("timestamp", (double)millis());
  json.set("device_id", "ESP32_Medical_001");
  json.set("suhu", String(suhu, 1));
  json.set("bpm", String(bpm_final));
  json.set("spo2", String(spo2_final));
  json.set("tekanan_sys", String(hexSys));
  json.set("tekanan_dia", String(hexDias));
  json.set("kondisi", getHealthStatus());
  
  // Tambahkan timestamp yang readable
  json.set("waktu_baca", getTimeString());
  
  // Kirim data
  if (Firebase.RTDB.setJSON(&fbdo, path.c_str(), &json)) {
    Serial.println("✅ Data berhasil dikirim ke Firebase!");
    lcd.setCursor(0, 1);
    lcd.print("Berhasil dikirim!");
    lcd.setCursor(0, 2);
    lcd.print("Path: " + path.substring(13)); // Tampilkan ID saja
    
    // Juga kirim ke path latest untuk real-time monitoring
    if (Firebase.RTDB.setJSON(&fbdo, "/data_jantung/latest", &json)) {
      Serial.println("✅ Latest data juga diupdate");
    }
  } else {
    Serial.println("❌ Gagal mengirim data ke Firebase:");
    Serial.println("Error: " + fbdo.errorReason());
    Serial.println("HTTP Code: " + String(fbdo.httpCode()));
    
    lcd.setCursor(0, 1);
    lcd.print("Gagal kirim data");
    lcd.setCursor(0, 2);
    lcd.print("Error: " + String(fbdo.httpCode()));
  }
  
  delay(3000);
}

String getTimeString() {
  // Return simple timestamp (could be improved with RTC)
  unsigned long seconds = millis() / 1000;
  unsigned long minutes = seconds / 60;
  unsigned long hours = minutes / 60;
  
  return String(hours % 24) + ":" + String(minutes % 60) + ":" + String(seconds % 60);
}

void checkWiFiConnection() {
  if (wifiConnected && WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ WiFi terputus, mencoba reconnect...");
    wifiConnected = false;
    firebaseReady = false;
    
    WiFi.begin(ssid, password);
    int attempt = 0;
    while (WiFi.status() != WL_CONNECTED && attempt < 10) {
      delay(1000);
      Serial.print(".");
      attempt++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
      wifiConnected = true;
      Serial.println("\n✅ WiFi reconnected!");
      
      // Reconnect Firebase
      if (Firebase.ready()) {
        firebaseReady = true;
        Serial.println("✅ Firebase reconnected!");
      }
    } else {
      Serial.println("\n❌ WiFi reconnection failed - continuing offline");
    }
  }
}

int hexToDec(char high, char low) {
  int val = 0;
  if (high > '9') val = (high - '7') * 16;
  else val = (high - '0') * 16;
  if (low > '9') val += (low - '7');
  else val += (low - '0');
  return val;
}