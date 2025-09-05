#include <Arduino.h>
#include <WiFi.h>
#include <Firebase_ESP_Client.h>

// Konfigurasi WiFi
const char* ssid = "DIR-612";        // Nama WiFi Anda
const char* password = "passwordwifi";      // Password WiFi Anda

// Konfigurasi Firebase
#define API_KEY "AIzaSyC_4FizusMK9ksaWcYXBmubsp3GGxuuX0g"
#define DATABASE_URL "https://monitoring-jantung-f8031-default-rtdb.firebaseio.com"

// Data objek Firebase
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

bool wifiConnected = false;
bool firebaseReady = false;

void setup() {
  Serial.begin(115200);
  delay(2000);
  
  Serial.println("\n=== Firebase Debug Mode ===");
  
  // Setup WiFi
  setupWiFi();
  
  // Setup Firebase jika WiFi berhasil
  if (wifiConnected) {
    setupFirebase();
  }
  
  Serial.println("\n=== Debug Setup Complete ===");
  Serial.println("WiFi: " + String(wifiConnected ? "OK" : "GAGAL"));
  Serial.println("Firebase: " + String(firebaseReady ? "OK" : "GAGAL"));
  
  if (firebaseReady) {
    testFirebaseWrite();
  }
}

void loop() {
  // Test setiap 30 detik
  static unsigned long lastTest = 0;
  
  if (millis() - lastTest > 30000) {
    lastTest = millis();
    
    if (firebaseReady) {
      Serial.println("\n--- Sending test data ---");
      sendTestData();
    } else {
      Serial.println("\n--- Firebase not ready, skipping test ---");
    }
  }
  
  delay(1000);
}

void setupWiFi() {
  Serial.print("Menghubungkan ke WiFi: ");
  Serial.println(ssid);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  int attempt = 0;
  while (WiFi.status() != WL_CONNECTED && attempt < 20) {
    delay(1000);
    Serial.print(".");
    attempt++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println("\n✅ WiFi terhubung!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal Strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    wifiConnected = false;
    Serial.println("\n❌ WiFi gagal terhubung");
  }
}

void setupFirebase() {
  Serial.println("\n--- Firebase Setup Debug ---");
  
  // Print konfigurasi
  Serial.println("API Key: " + String(API_KEY));
  Serial.println("Database URL: " + String(DATABASE_URL));
  
  // Setup konfigurasi Firebase
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  
  // Skip callback untuk menghindari compatibility issues
  config.token_status_callback = nullptr;
  
  Serial.println("Initializing Firebase...");
  
  // Initialize Firebase
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  
  Serial.println("Waiting for Firebase to be ready...");
  
  // Tunggu Firebase ready dengan timeout
  unsigned long startTime = millis();
  int dots = 0;
  
  while (!Firebase.ready() && (millis() - startTime) < 20000) {
    delay(500);
    Serial.print(".");
    dots++;
    if (dots > 40) {
      Serial.println();
      dots = 0;
    }
  }
  
  if (Firebase.ready()) {
    firebaseReady = true;
    Serial.println("\n✅ Firebase berhasil terhubung!");
  } else {
    firebaseReady = false;
    Serial.println("\n❌ Firebase timeout atau gagal");
    Serial.println("Error reason: " + fbdo.errorReason());
    Serial.println("HTTP Code: " + String(fbdo.httpCode()));
  }
}

// Callback function dihapus karena compatibility issues

void testFirebaseWrite() {
  Serial.println("\n--- Testing Firebase Write ---");
  
  String testPath = "/test_connection";
  String testValue = "Hello from ESP32 - " + String(millis());
  
  Serial.println("Writing to path: " + testPath);
  Serial.println("Value: " + testValue);
  
  if (Firebase.RTDB.setString(&fbdo, testPath, testValue)) {
    Serial.println("✅ Test write berhasil!");
    Serial.println("Response: " + fbdo.payload());
    
    // Coba baca kembali
    if (Firebase.RTDB.getString(&fbdo, testPath)) {
      Serial.println("✅ Test read berhasil!");
      Serial.println("Value read: " + fbdo.payload());
      
      // Hapus test data
      Firebase.RTDB.deleteNode(&fbdo, testPath);
      Serial.println("✅ Test data dihapus");
    } else {
      Serial.println("❌ Test read gagal");
      Serial.println("Error: " + fbdo.errorReason());
    }
  } else {
    Serial.println("❌ Test write gagal");
    Serial.println("Error: " + fbdo.errorReason());
    Serial.println("HTTP Code: " + String(fbdo.httpCode()));
  }
}

void sendTestData() {
  String path = "/data_jantung/test_" + String(millis());
  
  FirebaseJson json;
  json.set("timestamp", (double)millis());
  json.set("device_id", "ESP32_Debug");
  json.set("suhu", "36.5");
  json.set("bpm", "75");
  json.set("spo2", "98");
  json.set("tekanan_sys", "120");
  json.set("tekanan_dia", "80");
  json.set("kondisi", "Normal");
  json.set("test_mode", true);
  
  Serial.println("Sending to: " + path);
  
  if (Firebase.RTDB.setJSON(&fbdo, path, &json)) {
    Serial.println("✅ Test data sent successfully!");
    Serial.println("Data size: " + String(fbdo.payload().length()));
    
    // Update latest juga
    Firebase.RTDB.setJSON(&fbdo, "/data_jantung/latest", &json);
    Serial.println("✅ Latest data updated");
  } else {
    Serial.println("❌ Failed to send test data");
    Serial.println("Error: " + fbdo.errorReason());
    Serial.println("HTTP Code: " + String(fbdo.httpCode()));
    
    // Coba diagnosa masalah
    if (fbdo.httpCode() == 401) {
      Serial.println("🔍 HTTP 401 - Authentication problem");
    } else if (fbdo.httpCode() == 403) {
      Serial.println("🔍 HTTP 403 - Permission denied, check Firebase Rules");
    } else if (fbdo.httpCode() == 400) {
      Serial.println("🔍 HTTP 400 - Bad request, check data format");
    } else if (fbdo.httpCode() <= 0) {
      Serial.println("🔍 Network problem or connection issue");
    }
  }
}