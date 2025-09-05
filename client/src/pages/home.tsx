import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, BarChart3, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      {/* Background gradient animation */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full animate-float opacity-60" />
        <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-accent rounded-full animate-float opacity-40" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-primary rounded-full animate-bounce opacity-80" />
      </div>

      <div className="container mx-auto px-4 text-center relative z-10 py-8">
        <Card className="glass-card border-border/50 bg-card/60 backdrop-blur-lg p-8 md:p-12 rounded-3xl max-w-5xl mx-auto shadow-2xl">
          <CardContent className="p-0 space-y-8">
            {/* Thesis title - Better spacing */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent leading-tight">
                  PENERAPAN INTERNET OF THINGS
                </h1>
              </div>
              <div className="space-y-2">
                <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold text-foreground/90 max-w-4xl mx-auto leading-relaxed">
                  DALAM IDENTIFIKASI DINI DAN MONITORING
                </h2>
                <h3 className="text-lg md:text-xl lg:text-2xl font-medium text-accent max-w-3xl mx-auto">
                  KONDISI JANTUNG SECARA REAL-TIME
                </h3>
              </div>
              
              {/* Subtitle */}
              <div className="pt-4">
                <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Monitoring jantung real-time dengan ESP32 dan Naive Bayes AI
                </p>
              </div>
            </div>

            {/* Heart monitoring visualization - Better responsive design */}
            <div className="relative">
              <div className="flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-8">
                <div className="glass-card border-border/30 bg-gradient-to-br from-red-500/10 to-pink-500/20 p-6 rounded-2xl transform hover:scale-105 transition-transform duration-300">
                  <Heart className="w-12 md:w-16 h-12 md:h-16 text-red-500 mx-auto mb-3 animate-pulse" fill="currentColor" />
                  <p className="text-sm font-medium text-foreground">ESP32 IoT Device</p>
                  <p className="text-xs text-muted-foreground mt-1">Heart Rate Sensor</p>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="w-px h-8 sm:h-16 bg-gradient-to-b from-transparent via-primary to-transparent" />
                  <div className="w-3 h-3 bg-primary rounded-full animate-ping" />
                  <p className="text-xs text-primary font-medium mt-2">Real-time Data</p>
                </div>
                
                <div className="glass-card border-border/30 bg-gradient-to-br from-primary/10 to-accent/20 p-6 rounded-2xl transform hover:scale-105 transition-transform duration-300">
                  <BarChart3 className="w-12 md:w-16 h-12 md:h-16 text-primary mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground">Web Dashboard</p>
                  <p className="text-xs text-muted-foreground mt-1">Naive Bayes Analysis</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons - Better spacing and design */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/dashboard">
                  <Button 
                    size="lg"
                    className="group bg-gradient-to-r from-primary to-accent text-white px-10 py-5 text-lg font-semibold hover:shadow-xl transition-all duration-300 border-0 rounded-xl w-full sm:w-auto"
                    data-testid="button-go-to-dashboard"
                  >
                    Mulai Monitoring
                    <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                
                <Link href="/analysis">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="glass-card border-border/50 bg-card/30 px-10 py-5 text-lg font-semibold hover:bg-white/10 transition-all duration-300 rounded-xl w-full sm:w-auto"
                    data-testid="button-view-analysis"
                  >
                    Analisis AI
                  </Button>
                </Link>
              </div>
              
              <div className="pt-2">
                <p className="text-sm text-muted-foreground">
                  Sistem siap • ESP32 ready • Real-time dashboard
                </p>
              </div>
            </div>

            {/* Enhanced disclaimer with features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="glass-card bg-green-500/10 border-green-500/30 p-4 rounded-xl">
                <h4 className="font-semibold text-green-400 mb-2">✓ Monitoring Real-time</h4>
                <p className="text-xs text-muted-foreground">Data jantung langsung dari ESP32</p>
              </div>
              <div className="glass-card bg-blue-500/10 border-blue-500/30 p-4 rounded-xl">
                <h4 className="font-semibold text-blue-400 mb-2">✓ Naive Bayes AI</h4>
                <p className="text-xs text-muted-foreground">Klasifikasi otomatis kondisi jantung</p>
              </div>
              <div className="glass-card bg-purple-500/10 border-purple-500/30 p-4 rounded-xl">
                <h4 className="font-semibold text-purple-400 mb-2">✓ Firebase Database</h4>
                <p className="text-xs text-muted-foreground">Penyimpanan data cloud real-time</p>
              </div>
            </div>
            
            <Card className="mt-6 p-4 glass-card border border-amber-500/30 bg-amber-500/10">
              <CardContent className="p-0">
                <p className="text-sm text-muted-foreground text-center">
                  <span className="text-amber-400 font-semibold">Peringatan:</span> 
                  Sistem ini untuk monitoring penelitian, bukan untuk diagnosis medis. Konsultasi dengan dokter untuk masalah kesehatan.
                </p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
