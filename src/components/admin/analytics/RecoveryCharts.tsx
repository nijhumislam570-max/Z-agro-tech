import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--muted-foreground))'];

interface DailyDatum {
  date: string;
  total: number;
  recovered: number;
  rate: number;
}

interface PieDatum {
  name: string;
  value: number;
}

interface Props {
  dailyData: DailyDatum[];
  pieData: PieDatum[];
}

/**
 * Heavy recharts panel for the Recovery Analytics page.
 *
 * Extracted into its own module so recharts (~95 KB gzipped) is only
 * downloaded when an admin actually visits /admin/recovery-analytics.
 */
const RecoveryCharts = ({ dailyData, pieData }: Props) => {
  // Wrap children in a single host element with `display: contents` so the
  // page-level `space-y-5` rhythm still applies to each card individually,
  // while React.lazy can safely attach internal refs without warning.
  return (
    <div className="contents">

      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="border-border/50">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold">Daily Conversion Trend</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="total" fill="hsl(var(--muted-foreground))" name="Total" radius={[4, 4, 0, 0]} />
                <Bar dataKey="recovered" fill="hsl(var(--primary))" name="Recovered" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold">Recovery Rate Trend</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Line type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Recovery %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-semibold">Conversion Ratio</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex items-center justify-center">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={4}>
                {pieData.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx]} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-xs">{value}</span>} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecoveryCharts;
