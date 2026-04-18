import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { FraudAnalysis } from '@/lib/fraudDetection';

interface FraudRiskBadgeProps {
  analysis: FraudAnalysis;
  compact?: boolean;
}

const riskConfig = {
  low: {
    icon: ShieldCheck,
    label: 'Low Risk',
    className: 'bg-success-light text-success',
    iconColor: 'text-success',
  },
  medium: {
    icon: AlertTriangle,
    label: 'Medium Risk',
    className: 'bg-warning-light text-warning-foreground',
    iconColor: 'text-warning-foreground',
  },
  high: {
    icon: ShieldAlert,
    label: 'High Risk',
    className: 'bg-danger-light text-danger',
    iconColor: 'text-danger',
  },
};

export function FraudRiskBadge({ analysis, compact = false }: FraudRiskBadgeProps) {
  const config = riskConfig[analysis.level];
  const Icon = config.icon;

  const tooltipContent = analysis.signals.length > 0
    ? analysis.signals.map(s => `• ${s.label}`).join('\n')
    : 'No fraud signals detected';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium cursor-default transition-colors',
              config.className
            )}
          >
            <Icon className={cn('h-3 w-3', config.iconColor)} />
            {!compact && <span>{config.label}</span>}
            {compact && analysis.level !== 'low' && (
              <span>{analysis.score}</span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[250px]">
          <div className="space-y-1">
            <p className="font-medium">{config.label} (Score: {analysis.score})</p>
            {analysis.signals.length > 0 ? (
              <ul className="text-xs space-y-0.5">
                {analysis.signals.map(s => (
                  <li key={s.id}>• {s.label} (+{s.points})</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs">No fraud signals detected</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
