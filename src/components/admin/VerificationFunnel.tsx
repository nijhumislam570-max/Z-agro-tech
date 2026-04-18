import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Building2, Stethoscope } from 'lucide-react';
import type { VerificationFunnel as VerificationFunnelType } from '@/hooks/useAdminAnalytics';

interface VerificationFunnelProps {
  clinicFunnel: VerificationFunnelType;
  doctorFunnel: VerificationFunnelType;
}

const FunnelBar = ({
  label,
  count,
  total,
  variant,
}: {
  label: string;
  count: number;
  total: number;
  variant: 'muted' | 'amber' | 'emerald' | 'destructive';
}) => {
  const pct = total > 0 ? (count / total) * 100 : 0;
  const colorMap = {
    muted: 'bg-muted-foreground/30',
    amber: 'bg-amber-500',
    emerald: 'bg-emerald-500',
    destructive: 'bg-destructive',
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] sm:text-xs">
        <span className="text-muted-foreground capitalize">{label.replace('_', ' ')}</span>
        <span className="font-medium">{count}</span>
      </div>
      <div className="h-1.5 sm:h-2 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colorMap[variant]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export const VerificationFunnelSection = ({ clinicFunnel, doctorFunnel }: VerificationFunnelProps) => {
  const clinicTotal = clinicFunnel.not_submitted + clinicFunnel.pending + clinicFunnel.approved + clinicFunnel.rejected;
  const doctorTotal = doctorFunnel.not_submitted + doctorFunnel.pending + doctorFunnel.approved + doctorFunnel.rejected;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
      {/* Clinic Funnel */}
      <div className="bg-card rounded-xl border border-border p-3 sm:p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
            <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-600" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-semibold">Clinic Verification</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">{clinicTotal} total</p>
          </div>
          {clinicFunnel.pending > 0 && (
            <Badge className="ml-auto text-[10px] h-5 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800">
              {clinicFunnel.pending} pending
            </Badge>
          )}
        </div>
        <div className="space-y-2.5 sm:space-y-3">
          <FunnelBar label="Not Submitted" count={clinicFunnel.not_submitted} total={clinicTotal} variant="muted" />
          <FunnelBar label="Pending" count={clinicFunnel.pending} total={clinicTotal} variant="amber" />
          <FunnelBar label="Approved" count={clinicFunnel.approved} total={clinicTotal} variant="emerald" />
          <FunnelBar label="Rejected" count={clinicFunnel.rejected} total={clinicTotal} variant="destructive" />
        </div>
      </div>

      {/* Doctor Funnel */}
      <div className="bg-card rounded-xl border border-border p-3 sm:p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
            <Stethoscope className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-600" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-semibold">Doctor Verification</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">{doctorTotal} total</p>
          </div>
          {doctorFunnel.pending > 0 && (
            <Badge className="ml-auto text-[10px] h-5 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800">
              {doctorFunnel.pending} pending
            </Badge>
          )}
        </div>
        <div className="space-y-2.5 sm:space-y-3">
          <FunnelBar label="Not Submitted" count={doctorFunnel.not_submitted} total={doctorTotal} variant="muted" />
          <FunnelBar label="Pending" count={doctorFunnel.pending} total={doctorTotal} variant="amber" />
          <FunnelBar label="Approved" count={doctorFunnel.approved} total={doctorTotal} variant="emerald" />
          <FunnelBar label="Rejected" count={doctorFunnel.rejected} total={doctorTotal} variant="destructive" />
        </div>
      </div>
    </div>
  );
};
