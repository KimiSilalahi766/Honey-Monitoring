#include <Arduino.h>
#include <WiFi.h>
#include <Firebase_ESP_Client.h>

// Konfigurasi WiFi - GANTI SESUAI JARINGAN ANDA
const char* ssid = "DIR-612";        
const char* password = "88239484";      

// Konfigurasi Firebase
#define API_KEY "AIzaSyC_4FizusMK9ksaWcYXBmubsp3GGxuuX0g"
#define DATABASE_URL "https://monitoring-jantung-f8031-default-rtdb.firebaseio.com"

// Data objek Firebase
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

bool wifiConnected = false;
bool firebaseReady = false;
int testCounter = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n=== Simple Firebase Test ===");
  
  // Setup WiFi
  setupWiFi();
  
  // Setup Firebase jika WiFi berhasil
  if (wifiConnected) {
    setupFirebase();
  }
  
  Serial.println("\n=== Setup Complete ===");
  Serial.println("WiFi Status: " + String(wifiConnected ? "CONNECTED" : "FAILED"));
  Serial.println("Firebase Status: " + String(firebaseReady ? "READY" : "FAILED"));
  
  if (firebaseReady) {
    Serial.println("System ready - akan test Firebase setiap 10 detik");
  } else {
    Serial.println("Firebase gagal - cek konfigurasi");
  }
}

void loop() {
  static unsigned long lastTest = 0;
  
  if (firebaseReady && (millis() - lastTest > 10000)) {
    lastTest = millis();
    testCounter++;
    
    Serial.println("\n--- Test " + String(testCounter) + " ---");
    sendTestData();
  }
  
  delay(1000);
}

void setupWiFi() {
  Serial.print("Connecting to WiFi: ");
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
    Serial.println("\nWiFi Connected!");
    Serial.println("IP: " + WiFi.localIP().toString());
    Serial.println("Signal: " + String(WiFi.RSSI()) + " dBm");
  } else {
    wifiConnected = false;
    Serial.println("\nWiFi Failed!");
  }
}

void setupFirebase() {
  Serial.println("Setting up Firebase...");
  
  // Konfigurasi basic Firebase
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  
  Serial.println("API Key: " + String(API_KEY));
  Serial.println("Database URL: " + String(DATABASE_URL));
  
  // Initialize Firebase tanpa authentication
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  
  Serial.println("Waiting for Firebase...");
  
  // Test simple dengan timeout
  unsigned long startTime = millis();
  bool success = false;
  
  while (!success && (millis() - startTime) < 15000) {
    Serial.print(".");
    delay(1000);
    
    // Test simple write
    if (Firebase.RTDB.setString(&fbdo, "/test", "hello")) {
      success = true;
      firebaseReady = true;
      Serial.println("\nFirebase Connected Successfully!");
      
      // Baca balik untuk konfirmasi
      if (Firebase.RTDB.getString(&fbdo, "/test")) {
        Serial.println("Read test: " + fbdo.payload());
      }
      
      // Hapus test data
      Firebase.RTDB.deleteNode(&fbdo, "/test");
      
    } else {
      // Print error info
      if ((millis() - startTime) > 10000) {
        Serial.println("\nFirebase Error Details:");
        Serial.println("Error Reason: " + fbdo.errorReason());
        Serial.println("HTTP Code: " + String(fbdo.httpCode()));
        break;
      }
    }
  }
  
  if (!success) {
    firebaseReady = false;
    Serial.println("\nFirebase Failed to Connect!");
    
    // Analisa error
    if (fbdo.httpCode() == 401) {
      Serial.println("Error 401: Authentication issue");
    } else if (fbdo.httpCode() == 403) {
      Serial.println("Error 403: Permission denied - check Firebase Rules");
    } else if (fbdo.httpCode() == 400) {
      Serial.println("Error 400: Bad request");
    } else if (fbdo.httpCode() <= 0) {
      Serial.println("Network error or connection timeout");
    } else {
      Serial.println("HTTP Error: " + String(fbdo.httpCode()));
    }
  }
}

void sendTestData() {
  unsigned long timestamp = millis();
  String path = "/data_jantung/test_" + String(timestamp);
  
  Serial.println("Sending test data to: " + path);
  
  // Buat data JSON manual untuk compatibility
  String jsonData = "{";
  jsonData += "\"timestamp\":" + String(timestamp) + ",";
  jsonData += "\"device_id\":\"ESP32_Test\",";
  jsonData += "\"suhu\":\"36.5\",";
  jsonData += "\"bpm\":\"75\",";
  jsonData += "\"spo2\":\"98\",";
  jsonData += "\"tekanan_sys\":\"120\",";
  jsonData += "\"tekanan_dia\":\"80\",";
  jsonData += "\"kondisi\":\"Normal\",";
  jsonData += "\"test_number\":" + String(testCounter);
  jsonData += "}";
  
  Serial.println("JSON Data: " + jsonData);
  
  if (Firebase.RTDB.setJSON(&fbdo, path, jsonData)) {
    Serial.println("✅ Data sent successfully!");
    Serial.println("Response: " + fbdo.payload());
    
    // Update latest data juga
    if (Firebase.RTDB.setJSON(&fbdo, "/data_jantung/latest", jsonData)) {
      Serial.println("✅ Latest data updated!");
    }
    
    // Cek apakah data benar-benar tersimpan
    if (Firebase.RTDB.getString(&fbdo, path + "/device_id")) {
      Serial.println("✅ Verification read: " + fbdo.payload());
    }
    
  } else {
    Serial.println("❌ Failed to send data");
    Serial.println("Error: " + fbdo.errorReason());
    Serial.println("HTTP Code: " + String(fbdo.httpCode()));
    
    if (fbdo.httpCode() == 403) {
      Serial.println("🚨 SOLUSI: Ganti Firebase Rules menjadi:");
      Serial.println("{ \"rules\": { \".read\": true, \".write\": true } }");
    }
  }
}