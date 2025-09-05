import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { NaiveBayesAnalysis } from "@/components/naive-bayes-analysis";
import { useFirebaseData } from "@/hooks/use-firebase-data";

export default function Analysis() {
  const { currentData } = useFirebaseData();

  return (
    <div className="min-h-screen pt-24 pb-12 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Analisis Naive Bayes
              </h1>
              <p className="text-muted-foreground text-lg">
                Penerapan Internet of Things dalam Identifikasi Dini dan Monitoring Kondisi Jantung Secara Real-Time
              </p>
            </div>
            
            <Link href="/dashboard">
              <Button 
                variant="outline" 
                className="glass-card bg-card/40 backdrop-blur-lg"
                data-testid="button-back-to-dashboard"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Naive Bayes Analysis Component */}
        <NaiveBayesAnalysis currentData={currentData} />
      </div>

      {/* Floating Action Button - Home */}
      <Link href="/">
        <Button
          className="fixed bottom-6 left-6 w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 z-40 group border-0"
          data-testid="button-back-to-home"
        >
          <Home className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
        </Button>
      </Link>
    </div>
  );
}