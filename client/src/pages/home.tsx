import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, BarChart3, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background gradient animation */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20 animate-gradient" />
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full animate-float opacity-60" />
        <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-accent rounded-full animate-float opacity-40" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-primary rounded-full animate-bounce opacity-80" />
      </div>

      <div className="container mx-auto px-4 text-center relative z-10">
        <Card className="glass-card border-border/50 bg-card/40 backdrop-blur-lg p-12 rounded-3xl max-w-4xl mx-auto hover-lift">
          <CardContent className="p-0">
            {/* Thesis title */}
            <div className="mb-8">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent leading-tight">
                PENERAPAN INTERNET OF THINGS
              </h1>
              <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-foreground/90">
                DALAM IDENTIFIKASI DINI DAN MONITORING
              </h2>
              <h3 className="text-xl md:text-2xl font-medium text-accent">
                KONDISI JANTUNG SECARA REAL-TIME
              </h3>
            </div>

            {/* Heart monitoring visualization */}
            <div className="mb-8 relative">
              <div className="flex justify-center items-center space-x-8">
                <div className="glass-card border-border/30 bg-card/20 p-6 rounded-2xl animate-pulse-slow">
                  <Heart className="w-16 h-16 text-destructive mx-auto mb-2" fill="currentColor" />
                  <p className="text-sm text-muted-foreground">ESP32 IoT</p>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="w-px h-16 bg-gradient-to-b from-transparent via-primary to-transparent" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
                </div>
                
                <div className="glass-card border-border/30 bg-card/20 p-6 rounded-2xl">
                  <BarChart3 className="w-16 h-16 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Real-time Dashboard</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/dashboard">
                <Button 
                  size="lg"
                  className="group bg-gradient-to-r from-primary to-accent text-primary-foreground px-8 py-4 text-lg font-semibold hover:shadow-lg transition-all duration-300 border-0"
                  data-testid="button-go-to-dashboard"
                >
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              
              <Button 
                variant="outline" 
                size="lg"
                className="glass-card border-border/30 bg-card/20 px-8 py-4 text-lg font-semibold hover:bg-white/10 transition-colors"
                data-testid="button-learn-more"
              >
                Learn More
              </Button>
            </div>

            {/* Disclaimer */}
            <Card className="mt-8 p-4 glass-card border border-destructive/30 bg-destructive/5">
              <CardContent className="p-0">
                <p className="text-sm text-muted-foreground">
                  <span className="text-destructive font-semibold">Disclaimer:</span> 
                  This system is for monitoring only, not medical diagnosis or recommendations.
                </p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
