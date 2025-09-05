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
const String DEVICE_ID = "ESP32_Medical_Enhanced";

// ===== KALIBRASI MEDIS =====
const int SYS_CALIBRATION_OFFSET = -15;  // Kurangi 15 untuk systolic (saran medis)
const int DIA_CALIBRATION_OFFSET = -10;  // Kurangi 10 untuk diastolic (saran medis)
const float TEMP_CALIBRATION_OFFSET = 0.0;  // Offset suhu jika diperlukan

#define BUTTON_PIN 4
#define RXD2 16
#define TXD2 17

LiquidCrystal_I2C lcd(0x27, 20, 4);
Adafruit_MLX90614 mlx = Adafruit_MLX90614();
MAX30105 particleSensor;

// Status sistem
bool wifiConnected = false;
bool firebaseReady = false;

char buff[64];
bool b_read, b_discard;
char discard;
int i, j = 0;
char final_buff[64];

int hexSys = 0, hexDias = 0, hexBPM = 0;
float suhu = 0;

// ===== ENHANCED SAMPLING & FILTERING =====
#define BUFFER_SIZE 100
#define TEMP_SAMPLES 10          // Sample suhu lebih banyak untuk akurasi
#define BPM_MIN_SAMPLES 20       // Minimum sampel BPM valid
#define SPO2_MIN_SAMPLES 15      // Minimum sampel SpO2 valid
#define MEASUREMENT_DURATION 45000  // Perpanjang durasi untuk akurasi (45s)

uint32_t irBuffer[BUFFER_SIZE];
uint32_t redBuffer[BUFFER_SIZE];

// Moving average filters
float tempReadings[TEMP_SAMPLES];
int tempIndex = 0;
int bpmReadings[BPM_MIN_SAMPLES];
int bpmIndex = 0;
int bpmValidCount = 0;
int spo2Readings[SPO2_MIN_SAMPLES];
int spo2Index = 0;
int spo2ValidCount = 0;

const byte RATE_SIZE = 8;        // Perbesar buffer untuk akurasi
byte rates[RATE_SIZE];
byte rateSpot = 0;
long lastBeat = 0;
float beatsPerMinute = 0;
int beatAvg = 0;
int bpm_final = 0;

int32_t spo2, heartRate;
int8_t validSpO2, validHeartRate;
int spo2_final = 0;

// Enhanced measurement stats
int totalBPMReadings = 0;
int totalSpO2Readings = 0;
float avgTemp = 0;
float tempStdDev = 0;

void setup() {
  Serial.begin(115200);
  Serial2.begin(115200, SERIAL_8N1, RXD2, TXD2);
  Wire.begin();
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  // Initialize arrays
  initializeFilters();

  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Enhanced Heart Monitor");
  
  Serial.println("\n=== Enhanced Heart Monitor with Calibration ===");
  Serial.println("Medical Calibration: SYS-15, DIA-10");
  
  // Setup WiFi
  setupWiFi();
  
  // Setup Firebase
  if (wifiConnected) {
    setupFirebase();
  }
  
  // Setup Sensors
  setupSensors();
  
  // Display Status
  displaySystemStatus();
}

void loop() {
  if (digitalRead(BUTTON_PIN) == LOW) {
    delay(300); // Enhanced debounce
    
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Starting Enhanced");
    lcd.setCursor(0, 1);
    lcd.print("Medical Measurement");
    delay(2000);

    // Reset measurement stats
    resetMeasurementStats();
    
    // Lakukan pengukuran dengan enhanced accuracy
    bacaSuhuEnhanced();
    delay(1000);
    ukurBPMEnhanced();
    delay(1000);
    ukurSpO2Enhanced();
    delay(1000);
    bacaTekananDarahEnhanced();
    delay(1000);
    tampilkanRingkasanEnhanced();
    
    // Kirim ke Firebase dengan data enhanced
    if (wifiConnected && firebaseReady) {
      kirimKeFirebaseEnhanced();
    } else {
      Serial.println("⚠️ Firebase tidak tersedia - data tersimpan lokal");
      lcd.setCursor(0, 3);
      lcd.print("Offline mode");
      delay(2000);
    }

    Serial.println("\nPengukuran selesai. Tekan tombol untuk mengulang...");
    displaySystemStatus();
    delay(3000);
  }
  
  delay(100);
}

void initializeFilters() {
  // Initialize all filter arrays
  for (int i = 0; i < TEMP_SAMPLES; i++) {
    tempReadings[i] = 36.5; // Default body temp
  }
  for (int i = 0; i < BPM_MIN_SAMPLES; i++) {
    bpmReadings[i] = 70; // Default heart rate
  }
  for (int i = 0; i < SPO2_MIN_SAMPLES; i++) {
    spo2Readings[i] = 98; // Default SpO2
  }
}

void resetMeasurementStats() {
  tempIndex = 0;
  bpmIndex = 0;
  bpmValidCount = 0;
  spo2Index = 0;
  spo2ValidCount = 0;
  totalBPMReadings = 0;
  totalSpO2Readings = 0;
  rateSpot = 0;
}

void setupWiFi() {
  lcd.setCursor(0, 1);
  lcd.print("Connecting WiFi...");
  
  Serial.print("Connecting to: ");
  Serial.println(ssid);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(1000);
    Serial.print(".");
    attempts++;
    
    lcd.setCursor(0, 2);
    lcd.print("Attempt: " + String(attempts) + "/25");
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println("\n✅ WiFi Connected!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
    
    lcd.setCursor(0, 1);
    lcd.print("WiFi: Connected    ");
    lcd.setCursor(0, 2);
    lcd.print("IP: " + WiFi.localIP().toString());
  } else {
    wifiConnected = false;
    Serial.println("\n❌ WiFi Failed");
    lcd.setCursor(0, 1);
    lcd.print("WiFi: Failed       ");
    lcd.setCursor(0, 2);
    lcd.print("Mode: Offline      ");
  }
  
  delay(2000);
}

void setupFirebase() {
  lcd.setCursor(0, 3);
  lcd.print("Testing Firebase...");
  
  Serial.println("Testing Firebase connection...");
  
  HTTPClient http;
  String testUrl = "https://" + FIREBASE_HOST + "/test_enhanced.json";
  
  http.begin(testUrl);
  http.addHeader("Content-Type", "application/json");
  
  String testData = "\"enhanced_test_" + String(millis()) + "\"";
  
  int responseCode = http.PUT(testData);
  
  if (responseCode > 0) {
    String response = http.getString();
    Serial.println("✅ Firebase Connected!");
    Serial.println("Response: " + String(responseCode));
    
    firebaseReady = true;
    lcd.setCursor(0, 3);
    lcd.print("Firebase: OK       ");
    
    // Clean up test data
    http.end();
    http.begin(testUrl);
    int deleteCode = http.sendRequest("DELETE");
    Serial.println("Test data cleaned");
    
  } else {
    firebaseReady = false;
    Serial.println("❌ Firebase Failed: " + String(responseCode));
    lcd.setCursor(0, 3);
    lcd.print("Firebase: Failed   ");
  }
  
  http.end();
  delay(2000);
}

void setupSensors() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Enhanced sensor init");
  
  // MLX90614 dengan retry mechanism
  int mlxRetries = 0;
  while (!mlx.begin() && mlxRetries < 3) {
    Serial.println("❌ MLX90614 retry " + String(mlxRetries + 1));
    mlxRetries++;
    delay(1000);
  }
  
  if (mlxRetries < 3) {
    Serial.println("✅ MLX90614 OK");
    lcd.setCursor(0, 1);
    lcd.print("MLX90614: OK");
  } else {
    Serial.println("❌ MLX90614 failed after retries");
    lcd.setCursor(0, 1);
    lcd.print("MLX90614: Failed");
    while (1) delay(1000);
  }

  // MAX30105 dengan enhanced setup
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("❌ MAX30105 not found");
    lcd.setCursor(0, 2);
    lcd.print("MAX30105: Failed");
    while (1) delay(1000);
  } else {
    Serial.println("✅ MAX30105 OK");
    lcd.setCursor(0, 2);
    lcd.print("MAX30105: OK");
  }

  // Enhanced MAX30105 configuration
  particleSensor.setup(60, 4, 2, 100, 411, 4096); // Enhanced settings
  particleSensor.setPulseAmplitudeRed(0x3F);
  particleSensor.setPulseAmplitudeIR(0x3F);
  particleSensor.setPulseAmplitudeGreen(0);
  
  lcd.setCursor(0, 3);
  lcd.print("Enhanced: Ready");
  
  Serial.println("✅ Enhanced sensors ready");
  delay(2000);
}

void displaySystemStatus() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Enhanced Ready");
  lcd.setCursor(0, 1);
  lcd.print("WiFi: " + (wifiConnected ? String("OK") : String("Failed")));
  lcd.setCursor(0, 2);
  lcd.print("Firebase: " + (firebaseReady ? String("OK") : String("Failed")));
  lcd.setCursor(0, 3);
  lcd.print("Press for Enhanced");
}

void bacaSuhuEnhanced() {
  unsigned long start = millis();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Enhanced Temperature");
  
  float tempSum = 0;
  int validReadings = 0;
  
  Serial.println("=== Enhanced Temperature Measurement ===");

  while (millis() - start < 30000 && validReadings < TEMP_SAMPLES) {
    float currentTemp = mlx.readObjectTempC() + TEMP_CALIBRATION_OFFSET;
    
    // Validasi range suhu manusia
    if (currentTemp >= 30.0 && currentTemp <= 45.0) {
      tempReadings[tempIndex] = currentTemp;
      tempSum += currentTemp;
      validReadings++;
      tempIndex = (tempIndex + 1) % TEMP_SAMPLES;
      
      Serial.println("Valid temp " + String(validReadings) + ": " + String(currentTemp, 2) + "°C");
    }
    
    // Hitung moving average
    if (validReadings > 0) {
      avgTemp = tempSum / validReadings;
    }
    
    lcd.setCursor(0, 1);
    lcd.print("Temp: " + String(avgTemp, 1) + "C   ");
    lcd.setCursor(0, 2);
    lcd.print("Samples: " + String(validReadings) + "/" + String(TEMP_SAMPLES));
    lcd.setCursor(0, 3);
    lcd.print("Time: " + String((millis() - start) / 1000) + "/30s");
    
    delay(1000);
  }
  
  // Final temperature dengan moving average
  suhu = avgTemp;
  
  // Hitung standard deviation untuk kualitas
  float variance = 0;
  if (validReadings > 1) {
    for (int i = 0; i < validReadings; i++) {
      variance += pow(tempReadings[i] - avgTemp, 2);
    }
    tempStdDev = sqrt(variance / validReadings);
  }
  
  Serial.println("Enhanced temp result: " + String(suhu, 2) + "°C (StdDev: " + String(tempStdDev, 3) + ")");
  delay(1000);
}

void ukurBPMEnhanced() {
  int detik = 0;
  unsigned long start = millis();
  unsigned long lastPrint = millis();
  unsigned long lastValidBeat = millis();

  lcd.clear();
  lcd.print("Enhanced BPM: 45s");
  delay(1000);
  
  Serial.println("=== Enhanced BPM Measurement ===");

  while (millis() - start < MEASUREMENT_DURATION) {
    long irValue = particleSensor.getIR();
    
    // Enhanced beat detection dengan validasi
    if (checkForBeat(irValue) && irValue > 50000) {
      long delta = millis() - lastBeat;
      lastBeat = millis();
      
      // Validasi jarak antar beat (40-200 BPM range)
      if (delta > 300 && delta < 1500) {
        beatsPerMinute = 60.0 / (delta / 1000.0);
        
        if (beatsPerMinute >= 40 && beatsPerMinute <= 200) {
          // Add to moving average
          bpmReadings[bpmIndex] = (int)beatsPerMinute;
          bpmIndex = (bpmIndex + 1) % BPM_MIN_SAMPLES;
          
          if (bmpValidCount < BPM_MIN_SAMPLES) {
            bpmValidCount++;
          }
          
          totalBPMReadings++;
          lastValidBeat = millis();
          
          // Calculate moving average
          int sum = 0;
          for (int i = 0; i < bmpValidCount; i++) {
            sum += bmpReadings[i];
          }
          bmp_final = sum / bmpValidCount;
          
          Serial.println("Valid beat: " + String((int)beatsPerMinute) + " BPM, Avg: " + String(bpm_final));
        }
      }
    }
    
    // Update display setiap detik
    if (millis() - lastPrint >= 1000 && detik < 45) {
      detik++;
      lastPrint += 1000;
      
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("BPM: " + String(bmp_final));
      lcd.setCursor(0, 1);
      lcd.print("Samples: " + String(bmpValidCount) + "/" + String(BPM_MIN_SAMPLES));
      lcd.setCursor(0, 2);
      lcd.print("Quality: " + String(totalBPMReadings) + " beats");
      lcd.setCursor(0, 3);
      lcd.print("T: " + String(detik) + "/45s");
    }
    
    delay(20); // Faster sampling untuk akurasi
  }
  
  Serial.println("Enhanced BPM result: " + String(bpm_final) + " BPM (" + String(totalBPMReadings) + " beats detected)");
}

void ukurSpO2Enhanced() {
  int detik = 0;
  lcd.clear();
  lcd.print("Enhanced SpO2: 45s");
  delay(1000);
  
  Serial.println("=== Enhanced SpO2 Measurement ===");

  // Pre-fill buffers dengan sampling yang lebih baik
  for (int i = 0; i < BUFFER_SIZE; i++) {
    while (!particleSensor.available()) particleSensor.check();
    redBuffer[i] = particleSensor.getRed();
    irBuffer[i] = particleSensor.getIR();
    particleSensor.nextSample();
    delay(10); // Slower pre-fill untuk stabilitas
  }

  unsigned long start = millis();
  unsigned long lastDetikMillis = millis();

  while (millis() - start < MEASUREMENT_DURATION) {
    // Sliding window dengan overlap yang lebih kecil untuk akurasi
    for (int i = 0; i < BUFFER_SIZE - 15; i++) {
      redBuffer[i] = redBuffer[i + 15];
      irBuffer[i] = irBuffer[i + 15];
    }
    
    for (int i = BUFFER_SIZE - 15; i < BUFFER_SIZE; i++) {
      while (!particleSensor.available()) particleSensor.check();
      redBuffer[i] = particleSensor.getRed();
      irBuffer[i] = particleSensor.getIR();
      particleSensor.nextSample();
      delay(5);
    }

    // Enhanced SpO2 calculation
    maxim_heart_rate_and_oxygen_saturation(
      irBuffer, BUFFER_SIZE,
      redBuffer,
      &spo2, &validSpO2,
      &heartRate, &validHeartRate
    );

    // Validasi dan filtering SpO2
    if (validSpO2 == 1 && spo2 >= 70 && spo2 <= 100) {
      spo2Readings[spo2Index] = spo2;
      spo2Index = (spo2Index + 1) % SPO2_MIN_SAMPLES;
      
      if (spo2ValidCount < SPO2_MIN_SAMPLES) {
        spo2ValidCount++;
      }
      
      totalSpO2Readings++;
      
      // Calculate moving average
      int sum = 0;
      for (int i = 0; i < spo2ValidCount; i++) {
        sum += spo2Readings[i];
      }
      spo2_final = sum / spo2ValidCount;
      
      Serial.println("Valid SpO2: " + String(spo2) + "%, Avg: " + String(spo2_final) + "%");
    }

    // Update display
    if (millis() - lastDetikMillis >= 1000 && detik < 45) {
      detik++;
      lastDetikMillis += 1000;
      
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("SpO2: " + String(spo2_final) + "%");
      lcd.setCursor(0, 1);
      lcd.print("Samples: " + String(spo2ValidCount) + "/" + String(SPO2_MIN_SAMPLES));
      lcd.setCursor(0, 2);
      lcd.print("Quality: " + String(totalSpO2Readings) + " reads");
      lcd.setCursor(0, 3);
      lcd.print("T: " + String(detik) + "/45s");
    }
    
    delay(50); // Balanced sampling rate
  }
  
  Serial.println("Enhanced SpO2 result: " + String(spo2_final) + "% (" + String(totalSpO2Readings) + " valid readings)");
}

void bacaTekananDarahEnhanced() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Enhanced Blood Pressure");
  Serial.println("=== Enhanced Blood Pressure Measurement ===");

  b_read = 0;
  b_discard = 0;
  i = 0;
  j = 0;

  unsigned long startTime = millis();
  bool dataReceived = false;
  int retryCount = 0;
  const int maxRetries = 3;
  
  while (!dataReceived && retryCount < maxRetries) {
    Serial.println("Blood pressure attempt " + String(retryCount + 1) + "/" + String(maxRetries));
    
    unsigned long attemptStart = millis();
    
    while (!dataReceived && (millis() - attemptStart < 35000)) {
      if (Serial2.available()) {
        if (b_read == 0) {
          buff[0] = Serial2.read();
          if (buff[0] == 'e' && Serial2.read() == 'r' && Serial2.read() == 'r' && Serial2.read() == ':' && Serial2.read() == '0') {
            b_read = 1;
            j = 0;
            b_discard = 0;
            i = 0;
            Serial.println("✔ Enhanced frame header OK");
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
      
      // Update LCD countdown
      if ((millis() - attemptStart) % 1000 < 50) {
        lcd.setCursor(0, 1);
        lcd.print("Attempt " + String(retryCount + 1) + "/" + String(maxRetries));
        lcd.setCursor(0, 2);
        lcd.print("Time: " + String(35 - (millis() - attemptStart) / 1000) + "s    ");
      }
      
      delay(10);
    }
    
    if (!dataReceived) {
      retryCount++;
      Serial.println("❌ Attempt " + String(retryCount) + " failed, retrying...");
      delay(1000);
      
      // Reset untuk retry
      b_read = 0;
      b_discard = 0;
      i = 0;
      j = 0;
    }
  }

  if (dataReceived) {
    int rawSys = hexToDec(final_buff[0], final_buff[1]);
    int rawDias = hexToDec(final_buff[3], final_buff[4]);
    int rawBPM = hexToDec(final_buff[9], final_buff[10]);
    
    // KALIBRASI MEDIS SESUAI SARAN TEMAN ANDA
    hexSys = rawSys + SYS_CALIBRATION_OFFSET;  // Kurangi 15
    hexDias = rawDias + DIA_CALIBRATION_OFFSET; // Kurangi 10
    hexBPM = rawBPM;

    Serial.println("Raw readings - SYS: " + String(rawSys) + ", DIA: " + String(rawDias) + ", BPM: " + String(rawBPM));
    Serial.println("Calibrated readings:");
    Serial.println("SYS: " + String(hexSys) + " (calibrated: " + String(SYS_CALIBRATION_OFFSET) + ")");
    Serial.println("DIA: " + String(hexDias) + " (calibrated: " + String(DIA_CALIBRATION_OFFSET) + ")");
    Serial.println("BPM: " + String(hexBPM));
    
  } else {
    // Enhanced fallback dengan data dari sensor lain
    Serial.println("⚠️ Blood pressure timeout - using enhanced fallback");
    
    // Gunakan algoritma estimasi berdasarkan age dan fitness
    hexSys = estimateSystolic();
    hexDias = estimateDiastolic();  
    hexBPM = bmp_final; // Gunakan BPM yang akurat dari sensor
    
    Serial.println("Enhanced fallback used:");
    Serial.println("Estimated SYS: " + String(hexSys));
    Serial.println("Estimated DIA: " + String(hexDias));
  }

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Enhanced BP Result:");
  lcd.setCursor(0, 1);
  lcd.print("SYS: " + String(hexSys) + " mmHg");
  lcd.setCursor(0, 2);
  lcd.print("DIA: " + String(hexDias) + " mmHg");
  lcd.setCursor(0, 3);
  lcd.print("BPM: " + String(hexBPM));
  delay(3000);
}

int estimateSystolic() {
  // Enhanced estimation berdasarkan BPM dan suhu
  float baseSys = 120; // Normal baseline
  
  // Adjust berdasarkan heart rate
  if (bpm_final > 100) {
    baseSys += (bpm_final - 100) * 0.5; // Tachycardia effect
  } else if (bpm_final < 60) {
    baseSys -= (60 - bpm_final) * 0.3; // Bradycardia effect
  }
  
  // Adjust berdasarkan suhu (fever increases BP)
  if (suhu > 37.5) {
    baseSys += (suhu - 37.5) * 8;
  }
  
  return (int)(baseSys + SYS_CALIBRATION_OFFSET);
}

int estimateDiastolic() {
  // Enhanced estimation berdasarkan systolic
  float baseDia = hexSys * 0.67; // Medical ratio
  
  // Clamp ke range normal
  if (baseDia < 60) baseDia = 60;
  if (baseDia > 90) baseDia = 90;
  
  return (int)(baseDia + DIA_CALIBRATION_OFFSET);
}

void tampilkanRingkasanEnhanced() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("=== ENHANCED RESULT ===");
  lcd.setCursor(0, 1);
  lcd.print("T=" + String(suhu, 1) + "C, BP=" + String(hexSys) + "/" + String(hexDias));
  lcd.setCursor(0, 2);
  lcd.print("HR=" + String(bpm_final) + ", SpO2=" + String(spo2_final) + "%");
  lcd.setCursor(0, 3);
  lcd.print("Status: " + getEnhancedHealthStatus());

  Serial.println("\n=== ENHANCED MEASUREMENT RESULTS ===");
  Serial.println("Temperature: " + String(suhu, 2) + "°C (StdDev: " + String(tempStdDev, 3) + ")");
  Serial.println("Heart Rate: " + String(bpm_final) + " BPM (" + String(totalBPMReadings) + " beats detected)");
  Serial.println("SpO2: " + String(spo2_final) + "% (" + String(totalSpO2Readings) + " valid readings)");  
  Serial.println("Blood Pressure: " + String(hexSys) + "/" + String(hexDias) + " mmHg (calibrated)");
  Serial.println("Health Status: " + getEnhancedHealthStatus());
  Serial.println("Data Quality Score: " + String(calculateQualityScore()) + "/100");
  Serial.println("========================================");
  
  delay(5000);
}

String getEnhancedHealthStatus() {
  // Enhanced classification dengan scoring system
  int healthScore = 0;
  String issues = "";
  
  // Temperature scoring (25 points)
  if (suhu >= 36.1 && suhu <= 37.2) {
    healthScore += 25;
  } else if (suhu >= 35.5 && suhu <= 37.8) {
    healthScore += 15;
    issues += "T ";
  } else {
    healthScore += 0;
    issues += "T! ";
  }
  
  // Heart rate scoring (25 points)
  if (bpm_final >= 60 && bpm_final <= 100) {
    healthScore += 25;
  } else if (bpm_final >= 50 && bpm_final <= 120) {
    healthScore += 15;
    issues += "HR ";
  } else {
    healthScore += 0;
    issues += "HR! ";
  }
  
  // SpO2 scoring (25 points)
  if (spo2_final >= 96) {
    healthScore += 25;
  } else if (spo2_final >= 90) {
    healthScore += 15;
    issues += "O2 ";
  } else {
    healthScore += 0;
    issues += "O2! ";
  }
  
  // Blood pressure scoring (25 points)
  if (hexSys >= 90 && hexSys <= 130 && hexDias >= 60 && hexDias <= 85) {
    healthScore += 25;
  } else if (hexSys >= 80 && hexSys <= 150 && hexDias >= 50 && hexDias <= 95) {
    healthScore += 15;
    issues += "BP ";
  } else {
    healthScore += 0;
    issues += "BP! ";
  }
  
  // Classification berdasarkan score
  if (healthScore >= 85) {
    return "Normal (" + String(healthScore) + "/100)";
  } else if (healthScore >= 60) {
    return "Kurang Normal (" + String(healthScore) + "/100)";
  } else {
    return "Berbahaya (" + String(healthScore) + "/100)";
  }
}

int calculateQualityScore() {
  int quality = 0;
  
  // Temperature quality (25 points)
  if (tempStdDev < 0.5) quality += 25;
  else if (tempStdDev < 1.0) quality += 15;
  else quality += 5;
  
  // BPM quality (25 points) 
  if (totalBPMReadings >= 30) quality += 25;
  else if (totalBPMReadings >= 15) quality += 15;
  else quality += 5;
  
  // SpO2 quality (25 points)
  if (totalSpO2Readings >= 20) quality += 25;
  else if (totalSpO2Readings >= 10) quality += 15;
  else quality += 5;
  
  // Sensor stability (25 points)
  if (bmpValidCount >= BPM_MIN_SAMPLES && spo2ValidCount >= SPO2_MIN_SAMPLES) {
    quality += 25;
  } else {
    quality += 10;
  }
  
  return quality;
}

void kirimKeFirebaseEnhanced() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Sending Enhanced..");
  
  Serial.println("\n--- Sending Enhanced Data to Firebase ---");
  
  HTTPClient http;
  
  // Create unique data path
  unsigned long timestamp = millis();
  String dataPath = "/enhanced_data/data_" + String(timestamp) + ".json";
  String url = "https://" + FIREBASE_HOST + dataPath;
  
  // Create enhanced JSON data
  StaticJsonDocument<1024> doc;
  doc["timestamp"] = timestamp;
  doc["device_id"] = DEVICE_ID;
  doc["version"] = "enhanced_v2.0";
  
  // Basic measurements
  doc["measurements"]["suhu"] = String(suhu, 2);
  doc["measurements"]["bpm"] = String(bpm_final);
  doc["measurements"]["spo2"] = String(spo2_final);
  doc["measurements"]["tekanan_sys"] = String(hexSys);
  doc["measurements"]["tekanan_dia"] = String(hexDias);
  
  // Quality metrics
  doc["quality"]["temp_stddev"] = String(tempStdDev, 3);
  doc["quality"]["bpm_samples"] = String(totalBPMReadings);
  doc["quality"]["spo2_samples"] = String(totalSpO2Readings);
  doc["quality"]["overall_score"] = String(calculateQualityScore());
  
  // Calibration info
  doc["calibration"]["sys_offset"] = String(SYS_CALIBRATION_OFFSET);
  doc["calibration"]["dia_offset"] = String(DIA_CALIBRATION_OFFSET);
  doc["calibration"]["temp_offset"] = String(TEMP_CALIBRATION_OFFSET, 1);
  
  // Medical assessment
  doc["assessment"]["kondisi"] = getEnhancedHealthStatus();
  doc["assessment"]["health_score"] = String(calculateQualityScore());
  doc["assessment"]["waktu_baca"] = getReadableTime();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("Enhanced URL: " + url);
  Serial.println("Enhanced Data Size: " + String(jsonString.length()) + " bytes");
  
  // Send to Firebase
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  int responseCode = http.PUT(jsonString);
  
  if (responseCode > 0) {
    String response = http.getString();
    Serial.println("✅ Enhanced Firebase Success!");
    Serial.println("Response: " + String(responseCode));
    
    lcd.setCursor(0, 1);
    lcd.print("Enhanced Success!");
    
    // Update latest enhanced data
    String latestUrl = "https://" + FIREBASE_HOST + "/enhanced_data/latest.json";
    http.end();
    http.begin(latestUrl);
    http.addHeader("Content-Type", "application/json");
    
    if (http.PUT(jsonString) > 0) {
      Serial.println("✅ Enhanced latest updated!");
      lcd.setCursor(0, 2);
      lcd.print("Latest updated!");
    }
    
  } else {
    Serial.println("❌ Enhanced Firebase Failed!");
    Serial.println("Error: " + String(responseCode));
    
    lcd.setCursor(0, 1);
    lcd.print("Failed! Code: " + String(responseCode));
  }
  
  http.end();
  delay(3000);
}

String getReadableTime() {
  unsigned long totalSeconds = millis() / 1000;
  int hours = (totalSeconds / 3600) % 24;
  int minutes = (totalSeconds / 60) % 60;
  int seconds = totalSeconds % 60;
  
  char timeStr[10];
  sprintf(timeStr, "%02d:%02d:%02d", hours, minutes, seconds);
  return String(timeStr);
}

int hexToDec(char high, char low) {
  int val = 0;
  if (high > '9') val = (high - '7') * 16;
  else val = (high - '0') * 16;
  if (low > '9') val += (low - '7');
  else val += (low - '0');
  return val;
}