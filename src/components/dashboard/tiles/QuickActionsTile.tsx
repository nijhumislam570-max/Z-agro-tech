import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, ShoppingBag, GraduationCap, ShoppingCart, Truck } from 'lucide-react';

const actions = [
  { to: '/shop', label: 'Shop AgroInputs', icon: ShoppingBag },
  { to: '/academy', label: 'Browse Academy', icon: GraduationCap },
  { to: '/cart', label: 'View Cart', icon: ShoppingCart },
  { to: '/track-order', label: 'Track Order', icon: Truck },
];

export default function QuickActionsTile() {
  return (
    <Card className="h-full flex flex-col rounded-2xl border-border/60 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Zap className="h-4 w-4" />
          </span>
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2.5 flex-1">
        {actions.map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className="group flex flex-col items-start gap-2 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/60 hover:border-primary/30 px-3.5 py-3 transition-all duration-200 hover:-translate-y-0.5 min-h-[44px]"
          >
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary/15 group-hover:scale-110 transition-all">
              <a.icon className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold text-foreground leading-tight">{a.label}</span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
