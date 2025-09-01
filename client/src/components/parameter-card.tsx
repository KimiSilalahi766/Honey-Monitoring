import { Card, CardContent } from "@/components/ui/card";
import type { ParameterInfo } from '@shared/schema';
import { cn } from "@/lib/utils";

interface ParameterCardProps {
  title: string;
  parameter: ParameterInfo;
  progress?: number;
  className?: string;
  animated?: boolean;
}

export function ParameterCard({ 
  title, 
  parameter, 
  progress = 50, 
  className,
  animated = false 
}: ParameterCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'from-accent/20 to-accent/40 text-accent';
      case 'warning':
        return 'from-yellow-500/20 to-orange-500/20 text-yellow-400';
      case 'danger':
        return 'from-destructive/20 to-destructive/40 text-destructive';
      default:
        return 'from-muted/20 to-muted/40 text-muted-foreground';
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'from-accent to-primary';
      case 'warning':
        return 'from-yellow-400 to-orange-400';
      case 'danger':
        return 'from-destructive to-red-600';
      default:
        return 'from-muted to-muted-foreground';
    }
  };

  const getTextStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'text-accent';
      case 'warning':
        return 'text-yellow-400';
      case 'danger':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card className={cn(
      "glass-card hover-lift group border-border/50 bg-card/40 backdrop-blur-lg",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn(
            "p-3 rounded-xl bg-gradient-to-br transition-all duration-300",
            getStatusColor(parameter.status)
          )}>
            <div 
              className={cn(
                "w-6 h-6",
                animated && parameter.status === 'normal' && "animate-pulse-slow"
              )}
              dangerouslySetInnerHTML={{ __html: parameter.icon }}
            />
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              {title}
            </p>
            <p className={cn(
              "text-2xl font-bold font-mono transition-colors duration-300",
              getTextStatusColor(parameter.status)
            )} data-testid={`parameter-value-${title.toLowerCase()}`}>
              {parameter.value}{parameter.unit}
            </p>
          </div>
        </div>

        <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
          <div 
            className={cn(
              "h-2 rounded-full transition-all duration-500 bg-gradient-to-r",
              getProgressColor(parameter.status),
              animated && "animate-pulse"
            )}
            style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
          />
        </div>
        
        <p className="text-xs text-muted-foreground mt-2 font-medium">
          Normal Range: {parameter.range}
        </p>
      </CardContent>
    </Card>
  );
}
