import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ClassificationResponse } from '@shared/schema';

interface ClassificationStatusProps {
  classification: string;
  confidence?: number;
  probabilities?: Record<string, number>;
  className?: string;
}

export function ClassificationStatus({ 
  classification, 
  confidence = 0, 
  probabilities,
  className 
}: ClassificationStatusProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Normal':
        return {
          color: 'text-accent',
          bgColor: 'from-accent/20 to-accent/40',
          icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>',
          message: 'All parameters within healthy range',
          bgClass: 'bg-accent/10 border-accent/20'
        };
      case 'Kurang Normal':
        return {
          color: 'text-yellow-400',
          bgColor: 'from-yellow-500/20 to-orange-500/40',
          icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"/>',
          message: 'Some parameters need attention',
          bgClass: 'bg-yellow-500/10 border-yellow-500/20'
        };
      case 'Berbahaya':
        return {
          color: 'text-destructive',
          bgColor: 'from-destructive/20 to-destructive/40',
          icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"/>',
          message: 'Immediate medical attention required',
          bgClass: 'bg-destructive/10 border-destructive/20'
        };
      default:
        return {
          color: 'text-muted-foreground',
          bgColor: 'from-muted/20 to-muted/40',
          icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>',
          message: 'Classification unavailable',
          bgClass: 'bg-muted/10 border-muted/20'
        };
    }
  };

  const config = getStatusConfig(classification);

  return (
    <Card className={cn(
      "glass-card bg-card/40 backdrop-blur-lg border-border/50",
      config.bgClass,
      className
    )}>
      <CardContent className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-6 text-foreground">
          Heart Condition Classification
        </h2>
        
        <div className={cn(
          "inline-flex items-center space-x-4 p-6 rounded-2xl transition-all duration-300",
          "glass-card border border-border/30"
        )}>
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br transition-all duration-300",
            config.bgColor
          )}>
            <svg 
              className={cn("w-6 h-6", config.color)} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              dangerouslySetInnerHTML={{ __html: config.icon }}
            />
          </div>
          
          <div className="text-left">
            <p 
              className={cn("text-3xl font-bold transition-colors duration-300", config.color)}
              data-testid="classification-status"
            >
              {classification}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {config.message}
            </p>
            {confidence > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Confidence: {(confidence * 100).toFixed(1)}%
              </p>
            )}
          </div>
        </div>
        
        {probabilities && (
          <div className="mt-6 grid grid-cols-3 gap-3">
            {Object.entries(probabilities).map(([label, prob]) => (
              <div key={label} className="glass-card p-3 rounded-lg">
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
                <p className="text-sm font-bold mt-1">{(prob * 100).toFixed(1)}%</p>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 text-xs text-muted-foreground">
          Classification based on Naive Bayes algorithm
        </div>
      </CardContent>
    </Card>
  );
}
