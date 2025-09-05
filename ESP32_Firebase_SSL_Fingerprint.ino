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

// Konfigurasi WiFi - GANTI SESUAI JARINGAN ANDA
const char* ssid = "DIR-612";        
const char* password = "passwordwifi";      

// Konfigurasi Firebase dengan SSL Fingerprint
const String FIREBASE_HOST = "monitoring-jantung-f8031-default-rtdb.firebaseio.com";
const String FIREBASE_AUTH = "AIzaSyC_4FizusMK9ksaWcYXBmubsp3GGxuuX0g";
const char* FIREBASE_FINGERPRINT = "5E:7A:EF:1E:29:B9:08:F8:9B:D7:CC:54:55:EA:2B:14:AF:90:C8:DB";

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
  lcd.print("Heart Monitor SSL");
  
  Serial.println("\n=== Heart Monitor with SSL Fingerprint ===");
  
  // Setup WiFi
  setupWiFi();
  
  // Setup Firebase dengan SSL fingerprint
  if (wifiConnected) {
    setupFirebaseSSL();
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
      kirimDataKeFirebaseSSL();
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
  
  delay(100);
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

void setupFirebaseSSL() {
  lcd.setCursor(0, 3);
  lcd.print("Setup Firebase SSL..");
  
  Serial.println("Setup Firebase dengan SSL Fingerprint...");
  Serial.println("Fingerprint: " + String(FIREBASE_FINGERPRINT));
  
  WiFiClientSecure client;
  HTTPClient https;
  
  // Set SSL fingerprint untuk security
  client.setFingerprint(FIREBASE_FINGERPRINT);
  
  // Test connection dengan SSL
  String testUrl = "https://" + FIREBASE_HOST + "/test_ssl.json";
  
  https.begin(client, testUrl);
  https.addHeader("Content-Type", "application/json");
  
  String testData = "\"ssl_test_" + String(millis()) + "\"";
  
  Serial.println("Testing SSL connection...");
  Serial.println("URL: " + testUrl);
  
  int httpResponseCode = https.PUT(testData);
  
  if (httpResponseCode > 0) {
    String response = https.getString();
    Serial.println("✅ SSL Firebase terhubung!");
    Serial.println("Response Code: " + String(httpResponseCode));
    Serial.println("Response: " + response);
    
    firebaseReady = true;
    lcd.setCursor(0, 3);
    lcd.print("Firebase SSL: OK   ");
    
    // Hapus test data
    https.DELETE();
    Serial.println("✅ Test data SSL dihapus");
    
  } else {
    firebaseReady = false;
    Serial.println("❌ SSL Firebase gagal");
    Serial.println("Error Code: " + String(httpResponseCode));
    
    if (httpResponseCode == -1) {
      Serial.println("🔍 SSL Fingerprint mismatch atau connection timeout");
      Serial.println("💡 Coba update fingerprint dari grc.com");
    } else if (httpResponseCode == 403) {
      Serial.println("🔍 Firebase Rules problem");
    }
    
    lcd.setCursor(0, 3);
    lcd.print("Firebase SSL: Gagal");
  }
  
  https.end();
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

  unsigned long startTime = millis();
  bool dataReceived = false;
  
  while (!dataReceived && (millis() - startTime < 30000)) {
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
    
    hexSys = 120; 
    hexDias = 80;  
    hexBPM = bpm_final; 
    
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

void kirimDataKeFirebaseSSL() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Kirim via SSL...");
  
  Serial.println("Mengirim data ke Firebase via SSL...");
  
  WiFiClientSecure client;
  HTTPClient https;
  
  // Set SSL fingerprint
  client.setFingerprint(FIREBASE_FINGERPRINT);
  
  unsigned long timestamp = millis();
  String path = "/data_jantung/data_" + String(timestamp) + ".json";
  String url = "https://" + FIREBASE_HOST + path;
  
  // Buat JSON data
  String jsonData = "{";
  jsonData += "\"timestamp\":" + String(timestamp) + ",";
  jsonData += "\"device_id\":\"ESP32_SSL_Medical\",";
  jsonData += "\"suhu\":\"" + String(suhu, 1) + "\",";
  jsonData += "\"bpm\":\"" + String(bpm_final) + "\",";
  jsonData += "\"spo2\":\"" + String(spo2_final) + "\",";
  jsonData += "\"tekanan_sys\":\"" + String(hexSys) + "\",";
  jsonData += "\"tekanan_dia\":\"" + String(hexDias) + "\",";
  jsonData += "\"kondisi\":\"" + getHealthStatus() + "\",";
  jsonData += "\"waktu_baca\":\"" + getTimeString() + "\"";
  jsonData += "}";
  
  Serial.println("SSL URL: " + url);
  Serial.println("JSON: " + jsonData);
  
  https.begin(client, url);
  https.addHeader("Content-Type", "application/json");
  
  int httpResponseCode = https.PUT(jsonData);
  
  if (httpResponseCode > 0) {
    String response = https.getString();
    Serial.println("✅ Data SSL berhasil dikirim!");
    Serial.println("Response Code: " + String(httpResponseCode));
    Serial.println("Response: " + response);
    
    lcd.setCursor(0, 1);
    lcd.print("SSL: Berhasil!");
    lcd.setCursor(0, 2);
    lcd.print("Code: " + String(httpResponseCode));
    
    // Update latest data
    https.begin(client, "https://" + FIREBASE_HOST + "/data_jantung/latest.json");
    https.addHeader("Content-Type", "application/json");
    if (https.PUT(jsonData) > 0) {
      Serial.println("✅ Latest SSL data updated");
    }
    
  } else {
    Serial.println("❌ SSL Firebase gagal");
    Serial.println("Error Code: " + String(httpResponseCode));
    
    lcd.setCursor(0, 1);
    lcd.print("SSL: Gagal");
    lcd.setCursor(0, 2);
    lcd.print("Code: " + String(httpResponseCode));
    
    if (httpResponseCode == -1) {
      Serial.println("🔍 SSL Fingerprint mismatch");
      Serial.println("💡 Update fingerprint dari: https://grc.com/fingerprints.htm");
    }
  }
  
  https.end();
  delay(3000);
}

String getTimeString() {
  unsigned long seconds = millis() / 1000;
  unsigned long minutes = seconds / 60;
  unsigned long hours = minutes / 60;
  
  String timeStr = "";
  if (hours % 24 < 10) timeStr += "0";
  timeStr += String(hours % 24) + ":";
  if (minutes % 60 < 10) timeStr += "0";
  timeStr += String(minutes % 60) + ":";
  if (seconds % 60 < 10) timeStr += "0";
  timeStr += String(seconds % 60);
  
  return timeStr;
}

int hexToDec(char high, char low) {
  int val = 0;
  if (high > '9') val = (high - '7') * 16;
  else val = (high - '0') * 16;
  if (low > '9') val += (low - '7');
  else val += (low - '0');
  return val;
}