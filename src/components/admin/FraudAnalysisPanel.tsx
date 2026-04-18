import {
  MapPin,
  Phone,
  UserX,
  RefreshCw,
  XCircle,
  DollarSign,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import type { FraudAnalysis, FraudSignal } from '@/lib/fraudDetection';

interface FraudAnalysisPanelProps {
  analysis: FraudAnalysis;
}

const signalIcons: Record<FraudSignal['icon'], React.ElementType> = {
  address: MapPin,
  phone: Phone,
  name: UserX,
  repeat: RefreshCw,
  cancel: XCircle,
  amount: DollarSign,
};

const levelConfig = {
  low: {
    icon: ShieldCheck,
    label: 'Low Risk',
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    progressColor: 'bg-green-500',
  },
  medium: {
    icon: AlertTriangle,
    label: 'Medium Risk',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    progressColor: 'bg-amber-500',
  },
  high: {
    icon: ShieldAlert,
    label: 'High Risk',
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    progressColor: 'bg-red-500',
  },
};

export function FraudAnalysisPanel({ analysis }: FraudAnalysisPanelProps) {
  const config = levelConfig[analysis.level];
  const LevelIcon = config.icon;
  // Cap the progress at 100 (score of 100+)
  const progressValue = Math.min((analysis.score / 100) * 100, 100);

  return (
    <div className={cn('rounded-lg border p-3 sm:p-4 space-y-3', config.bg, config.border)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LevelIcon className={cn('h-5 w-5', config.color)} />
          <h4 className={cn('font-semibold text-sm', config.color)}>
            {config.label}
          </h4>
        </div>
        <div className="text-right">
          <span className={cn('text-lg font-bold', config.color)}>
            {analysis.score}
          </span>
          <span className="text-xs text-muted-foreground ml-1">pts</span>
        </div>
      </div>

      {/* Score Progress */}
      <div className="space-y-1">
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={cn('h-full rounded-full transition-all duration-500', config.progressColor)}
            style={{ width: `${progressValue}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>0 (Safe)</span>
          <span>20</span>
          <span>40</span>
          <span>100+ (Critical)</span>
        </div>
      </div>

      {/* Signals */}
      {analysis.signals.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Triggered Signals
          </p>
          {analysis.signals.map((signal) => {
            const SignalIcon = signalIcons[signal.icon] || AlertTriangle;
            return (
              <div
                key={signal.id}
                className="flex items-start gap-2 p-2 rounded-md bg-background/60"
              >
                <SignalIcon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{signal.label}</span>
                    <span className="text-xs font-mono text-muted-foreground shrink-0">
                      +{signal.points}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground break-words">
                    {signal.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No fraud signals detected for this order.
        </p>
      )}

      {/* Recommendation */}
      <div className="pt-2 border-t border-border/50">
        <p className="text-xs text-muted-foreground italic">
          💡 {analysis.recommendation}
        </p>
      </div>
    </div>
  );
}
