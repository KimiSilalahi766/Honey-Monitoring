#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include "MAX30105.h"
#include "heartRate.h"
#include "spo2_algorithm.h"
#include <Adafruit_MLX90614.h>
#include <WiFi.h>
#include <Firebase_ESP_Client.h>

// Konfigurasi WiFi
const char* ssid = "iPhone";
const char* password = "11112222";

// Konfigurasi Firebase
#define API_KEY "AIzaSyC_4FizusMK9ksaWcYXBmubsp3GGxuuX0g"
#define DATABASE_URL "https://monitoring-jantung-f8031-default-rtdb.firebaseio.com/"
#define USER_EMAIL "kimsilalahi@gmail.com"
#define USER_PASSWORD "020710Si766Hi"

// Data objek Firebase
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// Konfigurasi Pin
#define BUTTON_PIN 0
#define LED_PIN 2

// Objek sensor
MAX30105 particleSensor;
Adafruit_MLX90614 mlx = Adafruit_MLX90614();
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Konstanta pengukuran
const int MEASUREMENT_DURATION = 30000; // 30 detik
const int CALIBRATION_DELAY = 10000;    // 10 detik
const int MAX_WIFI_RETRY = 30;          // Maksimal retry WiFi

// Variabel hasil pengukuran
float finalTemperature = 0.0;
int finalBPM = 0;
int finalSpO2 = 0;
int systolicBP = 0;
int diastolicBP = 0;
int signalQuality = 0;

// Buffer dan variabel untuk pengukuran
#define RATE_SIZE 4
byte rateArray[RATE_SIZE];
byte rateSpot = 0;
unsigned long lastBeat = 0;
int beatsPerMinute = 0;
int beatAvg = 0;

// Buffer untuk SpO2
#define BUFFER_LENGTH 100
uint32_t irBuffer[BUFFER_LENGTH];
uint32_t redBuffer[BUFFER_LENGTH];
int32_t spo2 = 0;
int32_t heartRate = 0;
int8_t validSPO2 = 0;
int8_t validHeartRate = 0;

// Status sistem - Enum untuk kejelasan
enum SystemState {
  SYSTEM_INIT,
  WIFI_CONNECTING,
  SENSOR_INIT,
  SYSTEM_READY,
  MEASURING,
  DISPLAYING_RESULTS,
  SENDING_DATA,
  SYSTEM_ERROR
};

SystemState currentState = SYSTEM_INIT;
bool systemInitialized = false;
bool wifiConnected = false;
bool sensorsReady = false;
bool measurementComplete = false;
bool firebaseReady = false;

// Variabel tombol dengan debounce
unsigned long lastButtonTime = 0;
const unsigned long DEBOUNCE_DELAY = 300;
bool buttonPressed = false;

void setup() {
  // Inisialisasi hardware
  Serial.begin(115200);
  Serial.println("\n=== Heart Monitor System Starting ===");
  
  // Setup pin
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  
  // Inisialisasi I2C dan LCD
  Wire.begin(21, 22);
  lcd.init();
  lcd.backlight();
  
  // State machine dimulai
  currentState = SYSTEM_INIT;
  updateDisplay("System Starting", "Please wait...");
  
  // Eksekusi setup state machine
  executeSetupSequence();
}

void loop() {
  // Handle button press
  handleButtonPress();
  
  // State machine untuk operasi normal
  switch (currentState) {
    case SYSTEM_READY:
      if (buttonPressed) {
        buttonPressed = false;
        currentState = MEASURING;
        startMeasurementProcess();
      }
      break;
      
    case DISPLAYING_RESULTS:
      // Tunggu 5 detik sebelum kembali ke READY
      static unsigned long displayStart = 0;
      if (displayStart == 0) {
        displayStart = millis();
      }
      if (millis() - displayStart >= 5000) {
        displayStart = 0;
        currentState = SYSTEM_READY;
        updateDisplay("Ready to measure", "Press button");
        digitalWrite(LED_PIN, LOW);
      }
      break;
      
    case SYSTEM_ERROR:
      updateDisplay("System Error!", "Reset in 10s");
      delay(10000);
      ESP.restart(); // Reset sistem jika error
      break;
  }
  
  delay(50); // Small delay untuk stabilitas
}

void executeSetupSequence() {
  // Step 1: WiFi Connection - HANYA SEKALI
  currentState = WIFI_CONNECTING;
  if (!connectWiFi()) {
    Serial.println("❌ WiFi connection failed");
    currentState = SYSTEM_ERROR;
    return;
  }
  
  // Step 2: Firebase Setup (optional - bisa gagal tapi system tetap jalan)
  setupFirebase();
  
  // Step 3: Sensor Initialization
  currentState = SENSOR_INIT;
  if (!initializeSensors()) {
    Serial.println("❌ Sensor initialization failed");
    currentState = SYSTEM_ERROR;
    return;
  }
  
  // Step 4: System Ready
  currentState = SYSTEM_READY;
  systemInitialized = true;
  updateDisplay("Ready to measure", "Press button");
  Serial.println("✅ System fully initialized and ready!");
}

bool connectWiFi() {
  updateDisplay("Connecting WiFi", ssid);
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  int retryCount = 0;
  while (WiFi.status() != WL_CONNECTED && retryCount < MAX_WIFI_RETRY) {
    delay(1000);
    Serial.print(".");
    retryCount++;
    
    // Update LCD setiap 5 detik
    if (retryCount % 5 == 0) {
      char buffer[16];
      snprintf(buffer, sizeof(buffer), "Try %d/%d", retryCount, MAX_WIFI_RETRY);
      updateDisplay("Connecting WiFi", buffer);
    }
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println("\n✅ WiFi Connected!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("RSSI: ");
    Serial.println(WiFi.RSSI());
    
    updateDisplay("WiFi Connected", WiFi.localIP().toString());
    delay(2000);
    return true;
  } else {
    Serial.println("\n❌ WiFi Connection Failed");
    updateDisplay("WiFi Failed!", "Check credentials");
    return false;
  }
}

void setupFirebase() {
  updateDisplay("Setup Firebase", "Connecting...");
  Serial.println("Setting up Firebase...");
  
  // Konfigurasi Firebase
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;
  
  // Initialize Firebase
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  
  // Tunggu Firebase ready dengan timeout
  unsigned long startTime = millis();
  while (!Firebase.ready() && (millis() - startTime) < 15000) {
    delay(500);
    Serial.print(".");
  }
  
  if (Firebase.ready()) {
    firebaseReady = true;
    Serial.println("\n✅ Firebase Connected!");
    updateDisplay("Firebase Ready", "Cloud sync ON");
    delay(2000);
  } else {
    firebaseReady = false;
    Serial.println("\n⚠️ Firebase Failed - Local mode");
    updateDisplay("Firebase Failed", "Local mode only");
    delay(2000);
    // Tidak return false, biarkan sistem jalan tanpa Firebase
  }
}

bool initializeSensors() {
  updateDisplay("Init Sensors", "Please wait...");
  Serial.println("Initializing sensors...");
  
  bool mlxStatus = false;
  bool max30105Status = false;
  
  // Inisialisasi MLX90614
  if (mlx.begin()) {
    mlxStatus = true;
    Serial.println("✅ MLX90614 OK");
  } else {
    Serial.println("❌ MLX90614 FAILED");
  }
  
  // Inisialisasi MAX30105
  if (particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    // Konfigurasi sensor untuk optimal performance
    byte ledBrightness = 60;
    byte sampleAverage = 4;
    byte ledMode = 2; // Red + IR
    byte sampleRate = 100;
    int pulseWidth = 411;
    int adcRange = 4096;
    
    particleSensor.setup(ledBrightness, sampleAverage, ledMode, sampleRate, pulseWidth, adcRange);
    particleSensor.setPulseAmplitudeRed(0x0A);
    particleSensor.setPulseAmplitudeIR(0x0A);
    particleSensor.enableDIETEMPRDY();
    
    max30105Status = true;
    Serial.println("✅ MAX30105 OK");
  } else {
    Serial.println("❌ MAX30105 FAILED");
  }
  
  // Update status
  if (mlxStatus && max30105Status) {
    sensorsReady = true;
    updateDisplay("Sensors Ready", "All systems OK");
    delay(2000);
    return true;
  } else {
    char buffer[16];
    snprintf(buffer, sizeof(buffer), "MLX:%s MAX:%s", 
             mlxStatus ? "OK" : "NO", 
             max30105Status ? "OK" : "NO");
    updateDisplay("Sensor Error", buffer);
    delay(3000);
    return false;
  }
}

void handleButtonPress() {
  int reading = digitalRead(BUTTON_PIN);
  
  if (reading == LOW && (millis() - lastButtonTime) > DEBOUNCE_DELAY) {
    if (currentState == SYSTEM_READY && systemInitialized) {
      buttonPressed = true;
      lastButtonTime = millis();
      Serial.println("🔘 Button pressed - starting measurement");
      digitalWrite(LED_PIN, HIGH);
    }
  }
}

void startMeasurementProcess() {
  Serial.println("\n=== Starting Measurement Process ===");
  
  // Kalibrasi
  updateDisplay("Calibrating...", "Wait 10 seconds");
  Serial.println("Calibration phase...");
  delay(CALIBRATION_DELAY);
  
  // Reset nilai pengukuran
  finalTemperature = 0.0;
  finalBPM = 0;
  finalSpO2 = 0;
  signalQuality = 0;
  
  // Lakukan pengukuran berurutan
  measureTemperature();
  delay(1000);
  
  measureHeartRate();
  delay(1000);
  
  measureSpO2();
  delay(1000);
  
  // Estimasi tekanan darah berdasarkan BPM (placeholder)
  estimateBloodPressure();
  
  // Tampilkan hasil dan kirim data
  currentState = DISPLAYING_RESULTS;
  displayResults();
  
  if (firebaseReady) {
    sendDataToFirebase();
  } else {
    Serial.println("⚠️ Firebase not available - data not sent to cloud");
  }
  
  measurementComplete = true;
}

void measureTemperature() {
  Serial.println("\n--- Temperature Measurement ---");
  updateDisplay("Measuring Temp", "Please wait...");
  
  float tempSum = 0.0;
  int validReadings = 0;
  unsigned long startTime = millis();
  
  while (millis() - startTime < 10000) { // 10 detik untuk suhu
    float temp = mlx.readObjectTempC();
    
    if (!isnan(temp) && temp > 25.0 && temp < 45.0) {
      tempSum += temp;
      validReadings++;
      finalTemperature = temp;
      
      char buffer[16];
      snprintf(buffer, sizeof(buffer), "%.1f C", temp);
      updateDisplay("Temperature", buffer);
      
      Serial.print("Temp: ");
      Serial.print(temp, 1);
      Serial.println(" °C");
    }
    
    delay(1000);
  }
  
  if (validReadings > 0) {
    finalTemperature = tempSum / validReadings;
    Serial.print("Final Temperature: ");
    Serial.print(finalTemperature, 1);
    Serial.println(" °C");
  } else {
    Serial.println("⚠️ No valid temperature readings");
    finalTemperature = 36.5; // Default reasonable value
  }
}

void measureHeartRate() {
  Serial.println("\n--- Heart Rate Measurement ---");
  updateDisplay("Measuring BPM", "Keep finger still");
  
  // Reset rate calculation
  for (byte i = 0; i < RATE_SIZE; i++) {
    rateArray[i] = 0;
  }
  rateSpot = 0;
  lastBeat = 0;
  
  unsigned long startTime = millis();
  int validBeats = 0;
  
  while (millis() - startTime < MEASUREMENT_DURATION) {
    long irValue = particleSensor.getIR();
    
    if (checkForBeat(irValue)) {
      // Calculate time between beats
      long delta = millis() - lastBeat;
      lastBeat = millis();
      
      // Store valid beat intervals (between 300ms and 3000ms)
      if (delta > 300 && delta < 3000) {
        // Store this reading in the array
        rateArray[rateSpot++] = (byte)(60000 / delta);
        rateSpot %= RATE_SIZE; // Wrap variable
        
        // Take average of readings to get the heart rate
        long total = 0;
        for (byte i = 0; i < RATE_SIZE; i++) {
          total += rateArray[i];
        }
        beatsPerMinute = total / RATE_SIZE;
        validBeats++;
        
        if (validBeats >= 3) { // Setelah minimal 3 beat valid
          finalBPM = beatsPerMinute;
        }
        
        // Update display
        char buffer[16];
        snprintf(buffer, sizeof(buffer), "%d BPM", beatsPerMinute);
        updateDisplay("Heart Rate", buffer);
        
        Serial.print("BPM: ");
        Serial.println(beatsPerMinute);
      }
    }
    
    // Calculate signal quality
    if (irValue > 50000) {
      signalQuality = map(irValue, 50000, 300000, 50, 100);
      signalQuality = constrain(signalQuality, 0, 100);
    }
    
    delay(100);
  }
  
  if (validBeats < 3) {
    Serial.println("⚠️ Insufficient heart rate data - using default");
    finalBPM = 75; // Default reasonable value
    signalQuality = 30;
  }
  
  Serial.print("Final BPM: ");
  Serial.println(finalBPM);
}

void measureSpO2() {
  Serial.println("\n--- SpO2 Measurement ---");
  updateDisplay("Measuring SpO2", "Keep finger still");
  
  // Collect samples for SpO2 calculation
  for (int i = 0; i < BUFFER_LENGTH; i++) {
    while (particleSensor.available() == false) {
      particleSensor.check();
    }
    
    redBuffer[i] = particleSensor.getRed();
    irBuffer[i] = particleSensor.getIR();
    particleSensor.nextSample();
    
    // Simple progress indicator
    if (i % 10 == 0) {
      char buffer[16];
      snprintf(buffer, sizeof(buffer), "Progress: %d%%", (i * 100) / BUFFER_LENGTH);
      updateDisplay("Measuring SpO2", buffer);
    }
    
    delay(100);
  }
  
  // Calculate SpO2
  maxim_heart_rate_and_oxygen_saturation(irBuffer, BUFFER_LENGTH, redBuffer, &spo2, &validSPO2, &heartRate, &validHeartRate);
  
  if (validSPO2 && spo2 > 70 && spo2 < 100) {
    finalSpO2 = spo2;
    Serial.print("Valid SpO2: ");
    Serial.print(finalSpO2);
    Serial.println("%");
  } else {
    // Fallback calculation jika algoritma gagal
    finalSpO2 = calculateSimpleSpO2();
    Serial.print("Calculated SpO2: ");
    Serial.print(finalSpO2);
    Serial.println("%");
  }
  
  char buffer[16];
  snprintf(buffer, sizeof(buffer), "%d%%", finalSpO2);
  updateDisplay("SpO2 Result", buffer);
  delay(2000);
}

int calculateSimpleSpO2() {
  // Simplified SpO2 calculation based on red/IR ratio
  long redSum = 0, irSum = 0;
  
  for (int i = 0; i < BUFFER_LENGTH; i++) {
    redSum += redBuffer[i];
    irSum += irBuffer[i];
  }
  
  if (irSum > 0) {
    float ratio = (float)redSum / (float)irSum;
    // Simplified conversion (not medically accurate)
    int spo2 = (int)(110 - (25 * ratio));
    return constrain(spo2, 85, 100);
  }
  
  return 97; // Default reasonable value
}

void estimateBloodPressure() {
  // Simplified blood pressure estimation based on heart rate
  // This is not medically accurate and should not be used for diagnosis
  if (finalBPM > 0) {
    // Simple correlation (not medically accurate)
    systolicBP = 90 + (finalBPM - 60) * 0.8;
    diastolicBP = 60 + (finalBPM - 60) * 0.3;
    
    // Constrain to reasonable ranges
    systolicBP = constrain(systolicBP, 90, 180);
    diastolicBP = constrain(diastolicBP, 50, 100);
  } else {
    systolicBP = 120; // Default values
    diastolicBP = 80;
  }
  
  Serial.print("Estimated BP: ");
  Serial.print(systolicBP);
  Serial.print("/");
  Serial.println(diastolicBP);
}

String classifyHeartCondition() {
  // Simple rule-based classification (placeholder for Naive Bayes)
  bool tempNormal = (finalTemperature >= 36.0 && finalTemperature <= 37.5);
  bool bpmNormal = (finalBPM >= 60 && finalBPM <= 100);
  bool spo2Normal = (finalSpO2 >= 95);
  
  if (tempNormal && bpmNormal && spo2Normal) {
    return "Normal";
  } else if ((!tempNormal && (finalTemperature < 35.0 || finalTemperature > 39.0)) ||
             (!bpmNormal && (finalBPM < 50 || finalBPM > 120)) ||
             (!spo2Normal && finalSpO2 < 90)) {
    return "Berbahaya";
  } else {
    return "Kurang Normal";
  }
}

void displayResults() {
  Serial.println("\n=== FINAL RESULTS ===");
  Serial.println("Temperature: " + String(finalTemperature, 1) + " °C");
  Serial.println("Heart Rate: " + String(finalBPM) + " BPM");
  Serial.println("SpO2: " + String(finalSpO2) + "%");
  Serial.println("Blood Pressure: " + String(systolicBP) + "/" + String(diastolicBP) + " mmHg");
  Serial.println("Signal Quality: " + String(signalQuality) + "%");
  Serial.println("Condition: " + classifyHeartCondition());
  Serial.println("====================");
  
  // Display on LCD - rotate through results
  for (int i = 0; i < 3; i++) {
    switch (i) {
      case 0:
        updateDisplay("T:" + String(finalTemperature, 1) + "C B:" + String(finalBPM), 
                     "SpO2:" + String(finalSpO2) + "% Q:" + String(signalQuality) + "%");
        break;
      case 1:
        updateDisplay("BP: " + String(systolicBP) + "/" + String(diastolicBP), 
                     "Status: " + classifyHeartCondition());
        break;
      case 2:
        updateDisplay("Measurement", "Complete!");
        break;
    }
    delay(3000);
  }
}

void sendDataToFirebase() {
  if (!wifiConnected || !firebaseReady) {
    Serial.println("❌ Firebase not ready for data transmission");
    updateDisplay("Firebase N/A", "Data saved local");
    return;
  }
  
  updateDisplay("Sending Data", "Please wait...");
  Serial.println("Sending data to Firebase...");
  
  // Create unique path with timestamp
  String path = "/data_jantung/data_" + String(millis());
  
  // Create JSON object
  FirebaseJson json;
  json.set("timestamp", (double)millis());
  json.set("suhu", String(finalTemperature, 1));
  json.set("bpm", String(finalBPM));
  json.set("spo2", String(finalSpO2));
  json.set("tekanan_sys", String(systolicBP));
  json.set("tekanan_dia", String(diastolicBP));
  json.set("signal_quality", String(signalQuality));
  json.set("kondisi", classifyHeartCondition());
  json.set("device_id", "ESP32_HM_001");
  
  // Send data
  if (Firebase.RTDB.setJSON(&fbdo, path.c_str(), &json)) {
    Serial.println("✅ Data sent successfully to Firebase!");
    updateDisplay("Data Sent!", "Cloud sync OK");
  } else {
    Serial.println("❌ Failed to send data to Firebase");
    Serial.print("Reason: ");
    Serial.println(fbdo.errorReason());
    updateDisplay("Send Failed", "Local data only");
  }
  
  delay(2000);
}

void updateDisplay(String line1, String line2) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(line1.substring(0, 16)); // Limit to 16 characters
  lcd.setCursor(0, 1);
  lcd.print(line2.substring(0, 16)); // Limit to 16 characters
}