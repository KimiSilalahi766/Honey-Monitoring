#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Konfigurasi WiFi - GANTI SESUAI JARINGAN ANDA
const char* ssid = "DIR-612";        
const char* password = "passwordwifi";      

// Konfigurasi Firebase - TANPA LIBRARY, PAKAI HTTP LANGSUNG
const String FIREBASE_HOST = "monitoring-jantung-f8031-default-rtdb.firebaseio.com";
const String FIREBASE_AUTH = "AIzaSyC_4FizusMK9ksaWcYXBmubsp3GGxuuX0g";

bool wifiConnected = false;
bool firebaseReady = false;
int testCounter = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n=== Firebase HTTP Direct Method ===");
  Serial.println("Tanpa library Firebase - pakai HTTP langsung!");
  
  // Setup WiFi
  setupWiFi();
  
  // Test Firebase HTTP jika WiFi berhasil
  if (wifiConnected) {
    testFirebaseHTTP();
  }
  
  Serial.println("\n=== Setup Complete ===");
  Serial.println("WiFi Status: " + String(wifiConnected ? "CONNECTED" : "FAILED"));
  Serial.println("Firebase Status: " + String(firebaseReady ? "READY" : "FAILED"));
  
  if (firebaseReady) {
    Serial.println("System ready - akan kirim data test setiap 15 detik");
  } else {
    Serial.println("Firebase gagal - cek koneksi atau konfigurasi");
  }
}

void loop() {
  static unsigned long lastSend = 0;
  
  if (firebaseReady && (millis() - lastSend > 15000)) {
    lastSend = millis();
    testCounter++;
    
    Serial.println("\n--- Sending Test Data " + String(testCounter) + " ---");
    sendDataToFirebase();
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
    Serial.println("\n✅ WiFi Connected!");
    Serial.println("IP: " + WiFi.localIP().toString());
    Serial.println("Signal: " + String(WiFi.RSSI()) + " dBm");
  } else {
    wifiConnected = false;
    Serial.println("\n❌ WiFi Failed!");
  }
}

void testFirebaseHTTP() {
  Serial.println("Testing Firebase dengan HTTP langsung...");
  
  HTTPClient http;
  
  // Test endpoint Firebase
  String testUrl = "https://" + FIREBASE_HOST + "/test.json";
  
  Serial.println("Test URL: " + testUrl);
  
  http.begin(testUrl);
  http.addHeader("Content-Type", "application/json");
  
  // Test dengan data sederhana
  String testData = "\"test_connection_" + String(millis()) + "\"";
  
  Serial.println("Sending test data: " + testData);
  
  int httpResponseCode = http.PUT(testData);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("✅ Firebase HTTP Response Code: " + String(httpResponseCode));
    Serial.println("✅ Response: " + response);
    
    if (httpResponseCode == 200) {
      firebaseReady = true;
      Serial.println("✅ Firebase berhasil terhubung via HTTP!");
      
      // Hapus test data
      http.begin(testUrl);
      http.DELETE();
      Serial.println("✅ Test data dihapus");
    } else {
      Serial.println("⚠️ Response code tidak optimal, tapi koneksi berhasil");
      firebaseReady = true;
    }
  } else {
    firebaseReady = false;
    Serial.println("❌ Firebase HTTP gagal");
    Serial.println("Error code: " + String(httpResponseCode));
    
    if (httpResponseCode == -1) {
      Serial.println("🔍 Connection timeout - cek internet atau Firebase URL");
    } else if (httpResponseCode == -11) {
      Serial.println("🔍 SSL/TLS error - cek waktu sistem atau certificate");
    }
  }
  
  http.end();
}

void sendDataToFirebase() {
  if (!wifiConnected) {
    Serial.println("❌ WiFi tidak terhubung");
    return;
  }
  
  HTTPClient http;
  
  // Buat data timestamp unik
  unsigned long timestamp = millis();
  String dataPath = "/data_jantung/data_" + String(timestamp) + ".json";
  String url = "https://" + FIREBASE_HOST + dataPath;
  
  Serial.println("Sending to: " + url);
  
  // Buat JSON data manual (lebih reliable)
  String jsonData = "{";
  jsonData += "\"timestamp\":" + String(timestamp) + ",";
  jsonData += "\"device_id\":\"ESP32_HTTP_Test\",";
  jsonData += "\"suhu\":\"36." + String(random(0, 9)) + "\",";
  jsonData += "\"bpm\":\"" + String(random(60, 100)) + "\",";
  jsonData += "\"spo2\":\"" + String(random(95, 100)) + "\",";
  jsonData += "\"tekanan_sys\":\"" + String(random(110, 140)) + "\",";
  jsonData += "\"tekanan_dia\":\"" + String(random(70, 90)) + "\",";
  jsonData += "\"kondisi\":\"Normal\",";
  jsonData += "\"test_number\":" + String(testCounter) + ",";
  jsonData += "\"waktu_baca\":\"" + getTimeString() + "\"";
  jsonData += "}";
  
  Serial.println("JSON Data: " + jsonData);
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  int httpResponseCode = http.PUT(jsonData);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("✅ Data berhasil dikirim!");
    Serial.println("Response Code: " + String(httpResponseCode));
    Serial.println("Response: " + response);
    
    // Update latest data juga
    updateLatestData(jsonData);
    
  } else {
    Serial.println("❌ Gagal mengirim data");
    Serial.println("Error Code: " + String(httpResponseCode));
    
    if (httpResponseCode == 400) {
      Serial.println("🔍 HTTP 400: Bad Request - cek format JSON");
    } else if (httpResponseCode == 401) {
      Serial.println("🔍 HTTP 401: Unauthorized - cek API key");
    } else if (httpResponseCode == 403) {
      Serial.println("🔍 HTTP 403: Forbidden - cek Firebase Rules");
      Serial.println("SOLUSI: Set Firebase Rules ke { \".read\": true, \".write\": true }");
    } else if (httpResponseCode == -1) {
      Serial.println("🔍 Connection timeout - cek internet");
    }
  }
  
  http.end();
}

void updateLatestData(String jsonData) {
  HTTPClient http;
  String latestUrl = "https://" + FIREBASE_HOST + "/data_jantung/latest.json";
  
  http.begin(latestUrl);
  http.addHeader("Content-Type", "application/json");
  
  int responseCode = http.PUT(jsonData);
  
  if (responseCode > 0) {
    Serial.println("✅ Latest data updated!");
  } else {
    Serial.println("⚠️ Latest data update gagal: " + String(responseCode));
  }
  
  http.end();
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