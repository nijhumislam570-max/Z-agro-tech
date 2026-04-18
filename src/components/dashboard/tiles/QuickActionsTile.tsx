import { Link } from 'react-router-dom';
import { GlassCard } from '../GlassCard';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, GraduationCap, ShoppingCart, Truck } from 'lucide-react';

const actions = [
  { to: '/shop', label: 'Shop AgroInputs', icon: ShoppingBag },
  { to: '/academy', label: 'Browse Academy', icon: GraduationCap },
  { to: '/cart', label: 'View Cart', icon: ShoppingCart },
  { to: '/track-order', label: 'Track Order', icon: Truck },
];

export default function QuickActionsTile() {
  return (
    <GlassCard className="col-span-1 lg:col-span-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-white">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2.5">
        {actions.map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className="group flex flex-col items-start gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 hover:border-white/30 px-3.5 py-3 transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <a.icon className="h-4 w-4 text-white" />
            </div>
            <span className="text-xs font-semibold text-white leading-tight">{a.label}</span>
          </Link>
        ))}
      </CardContent>
    </GlassCard>
  );
}
