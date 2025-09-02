#include <WiFi.h>

// Konfigurasi WiFi - Ganti sesuai jaringan Anda
const char* ssid = "ATEKU KOPI 1 5G";
const char* password = "11112222";

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n=== ESP32 WiFi Connection Test ===");
  Serial.print("SSID: ");
  Serial.println(ssid);
  Serial.print("Password Length: ");
  Serial.println(strlen(password));
  
  // Test berbagai metode koneksi WiFi
  testWiFiConnection();
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi masih terhubung - RSSI: " + String(WiFi.RSSI()));
  } else {
    Serial.println("WiFi terputus - Status: " + String(WiFi.status()));
  }
  delay(5000);
}

void testWiFiConnection() {
  Serial.println("\n--- Test 1: Basic Connection ---");
  WiFi.begin(ssid, password);
  
  int timeout = 0;
  while (WiFi.status() != WL_CONNECTED && timeout < 20) {
    delay(1000);
    Serial.print(".");
    Serial.print(WiFi.status());
    timeout++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ Basic connection SUCCESS!");
    printWiFiInfo();
    return;
  }
  
  Serial.println("\n❌ Basic connection FAILED");
  Serial.println("Trying alternative methods...");
  
  // Test 2: Reset dan coba lagi
  Serial.println("\n--- Test 2: Reset Method ---");
  WiFi.disconnect();
  WiFi.mode(WIFI_OFF);
  delay(2000);
  WiFi.mode(WIFI_STA);
  delay(1000);
  
  WiFi.begin(ssid, password);
  timeout = 0;
  while (WiFi.status() != WL_CONNECTED && timeout < 30) {
    delay(500);
    Serial.print(".");
    timeout++;
    
    if (timeout % 10 == 0) {
      Serial.print("[");
      Serial.print(WiFi.status());
      Serial.print("]");
    }
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ Reset method SUCCESS!");
    printWiFiInfo();
    return;
  }
  
  Serial.println("\n❌ Reset method FAILED");
  
  // Test 3: Manual IP (jika diperlukan)
  Serial.println("\n--- Test 3: Static IP Method ---");
  IPAddress local_IP(192, 168, 1, 184);
  IPAddress gateway(192, 168, 1, 1);
  IPAddress subnet(255, 255, 255, 0);
  IPAddress primaryDNS(8, 8, 8, 8);
  IPAddress secondaryDNS(8, 8, 4, 4);
  
  if (!WiFi.config(local_IP, gateway, subnet, primaryDNS, secondaryDNS)) {
    Serial.println("Static IP config failed");
  }
  
  WiFi.begin(ssid, password);
  timeout = 0;
  while (WiFi.status() != WL_CONNECTED && timeout < 20) {
    delay(1000);
    Serial.print(".");
    timeout++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ Static IP method SUCCESS!");
    printWiFiInfo();
    return;
  }
  
  Serial.println("\n❌ Static IP method FAILED");
  
  // Test 4: Scan available networks
  Serial.println("\n--- Test 4: Network Scan ---");
  scanWiFiNetworks();
  
  // Final diagnosis
  Serial.println("\n=== DIAGNOSIS ===");
  Serial.println("Status Code: " + String(WiFi.status()));
  Serial.println("Status Meanings:");
  Serial.println("0: WL_IDLE_STATUS - Idle");
  Serial.println("1: WL_NO_SSID_AVAIL - No SSID available");
  Serial.println("2: WL_SCAN_COMPLETED - Scan completed");
  Serial.println("3: WL_CONNECTED - Connected");
  Serial.println("4: WL_CONNECT_FAILED - Connection failed");
  Serial.println("5: WL_CONNECTION_LOST - Connection lost");
  Serial.println("6: WL_DISCONNECTED - Disconnected");
  Serial.println("255: WL_NO_SHIELD - No WiFi shield");
  
  Serial.println("\n=== RECOMMENDATIONS ===");
  Serial.println("1. Periksa SSID dan Password");
  Serial.println("2. Pastikan ESP32 dalam jangkauan WiFi");
  Serial.println("3. Restart router WiFi");
  Serial.println("4. Coba dengan HP hotspot untuk testing");
  Serial.println("5. Periksa apakah WiFi menggunakan WPA2");
}

void printWiFiInfo() {
  Serial.println("\n=== WiFi Connection Info ===");
  Serial.println("SSID: " + WiFi.SSID());
  Serial.println("IP Address: " + WiFi.localIP().toString());
  Serial.println("Gateway: " + WiFi.gatewayIP().toString());
  Serial.println("Subnet: " + WiFi.subnetMask().toString());
  Serial.println("DNS1: " + WiFi.dnsIP().toString());
  Serial.println("MAC Address: " + WiFi.macAddress());
  Serial.println("RSSI: " + String(WiFi.RSSI()) + " dBm");
  Serial.println("Channel: " + String(WiFi.channel()));
  Serial.println("============================");
}

void scanWiFiNetworks() {
  Serial.println("Scanning for WiFi networks...");
  int n = WiFi.scanNetworks();
  
  if (n == 0) {
    Serial.println("No networks found");
  } else {
    Serial.println("Networks found: " + String(n));
    Serial.println("ID | SSID                     | RSSI | Encryption");
    Serial.println("---|--------------------------|------|----------");
    
    for (int i = 0; i < n; ++i) {
      Serial.printf("%2d | %-24s | %4d | %s\n", 
                   i, 
                   WiFi.SSID(i).c_str(), 
                   WiFi.RSSI(i),
                   getEncryptionType(WiFi.encryptionType(i)).c_str());
      
      // Check if our SSID is found
      if (WiFi.SSID(i) == ssid) {
        Serial.println("    ^ TARGET NETWORK FOUND!");
      }
    }
  }
}

String getEncryptionType(wifi_auth_mode_t encryptionType) {
  switch (encryptionType) {
    case WIFI_AUTH_OPEN:            return "Open";
    case WIFI_AUTH_WEP:             return "WEP";
    case WIFI_AUTH_WPA_PSK:         return "WPA";
    case WIFI_AUTH_WPA2_PSK:        return "WPA2";
    case WIFI_AUTH_WPA_WPA2_PSK:    return "WPA+WPA2";
    case WIFI_AUTH_WPA2_ENTERPRISE: return "WPA2-ENT";
    case WIFI_AUTH_WPA3_PSK:        return "WPA3";
    case WIFI_AUTH_WPA2_WPA3_PSK:   return "WPA2+WPA3";
    default:                        return "Unknown";
  }
}