import { useMemo } from 'react';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Calendar, DollarSign, Users, 
  Clock, Stethoscope, Package, Star, Target, Activity
} from 'lucide-react';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string | null;
  created_at: string;
  pet_type: string | null;
  doctor?: {
    id: string;
    name: string;
  } | null;
}

interface ClinicService {
  id: string;
  name: string;
  price: number | null;
  is_active: boolean;
}

interface ClinicDoctor {
  id: string;
  status: string;
  doctor?: {
    id: string;
    name: string;
    consultation_fee: number | null;
    is_available: boolean;
  };
}

interface ClinicAnalyticsChartsProps {
  appointments: Appointment[];
  services: ClinicService[];
  doctors: ClinicDoctor[];
  clinicRating: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(142.1, 76.2%, 36.3%)', 'hsl(47.9, 95.8%, 53.1%)', 'hsl(0, 72.2%, 50.6%)', 'hsl(221.2, 83.2%, 53.3%)'];

const ClinicAnalyticsCharts = ({ appointments, services, doctors, clinicRating }: ClinicAnalyticsChartsProps) => {
  
  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = appointments.filter(a => {
      const date = new Date(a.appointment_date);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
    
    const lastMonth = appointments.filter(a => {
      const date = new Date(a.appointment_date);
      const lastMonthDate = subDays(now, 30);
      return date >= subDays(lastMonthDate, 30) && date < lastMonthDate;
    });

    const completedThisMonth = thisMonth.filter(a => a.status === 'completed').length;
    const completedLastMonth = lastMonth.filter(a => a.status === 'completed').length;
    
    const growthRate = completedLastMonth > 0 
      ? ((completedThisMonth - completedLastMonth) / completedLastMonth) * 100 
      : completedThisMonth > 0 ? 100 : 0;

    // Estimate revenue based on average consultation fee
    const avgFee = doctors.reduce((acc, d) => acc + (d.doctor?.consultation_fee || 500), 0) / Math.max(doctors.length, 1);
    const estimatedRevenue = completedThisMonth * avgFee;
    const lastMonthRevenue = completedLastMonth * avgFee;
    const revenueGrowth = lastMonthRevenue > 0 
      ? ((estimatedRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : estimatedRevenue > 0 ? 100 : 0;

    return {
      totalThisMonth: thisMonth.length,
      completedThisMonth,
      pendingCount: appointments.filter(a => a.status === 'pending').length,
      cancelledRate: thisMonth.length > 0 
        ? (thisMonth.filter(a => a.status === 'cancelled').length / thisMonth.length) * 100 
        : 0,
      growthRate,
      estimatedRevenue,
      revenueGrowth,
      avgAppointmentsPerDoctor: doctors.length > 0 ? completedThisMonth / doctors.length : 0,
    };
  }, [appointments, doctors]);

  // Appointments trend data (last 14 days)
  const trendData = useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(new Date(), 13),
      end: new Date()
    });

    return days.map(day => {
      const dayAppointments = appointments.filter(a => 
        isSameDay(new Date(a.appointment_date), day)
      );
      return {
        date: format(day, 'MMM d'),
        shortDate: format(day, 'dd'),
        total: dayAppointments.length,
        completed: dayAppointments.filter(a => a.status === 'completed').length,
        confirmed: dayAppointments.filter(a => a.status === 'confirmed').length,
        pending: dayAppointments.filter(a => a.status === 'pending').length,
      };
    });
  }, [appointments]);

  // Status distribution
  const statusData = useMemo(() => {
    const statuses = ['completed', 'confirmed', 'pending', 'cancelled'];
    return statuses.map((status, index) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: appointments.filter(a => a.status === status).length,
      color: COLORS[index]
    })).filter(s => s.value > 0);
  }, [appointments]);

  // Pet type distribution
  const petTypeData = useMemo(() => {
    const petTypes: Record<string, number> = {};
    appointments.forEach(a => {
      const type = a.pet_type || 'Unknown';
      petTypes[type] = (petTypes[type] || 0) + 1;
    });
    return Object.entries(petTypes)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [appointments]);

  // Doctor performance
  const doctorPerformance = useMemo(() => {
    return doctors.map(d => {
      const doctorAppointments = appointments.filter(a => a.doctor?.id === d.doctor?.id);
      return {
        name: d.doctor?.name?.split(' ')[0] || 'Unknown',
        appointments: doctorAppointments.length,
        completed: doctorAppointments.filter(a => a.status === 'completed').length,
        available: d.doctor?.is_available ? 1 : 0,
      };
    }).filter(d => d.appointments > 0);
  }, [appointments, doctors]);

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `৳${(value / 1000).toFixed(1)}k`;
    }
    return `৳${value}`;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="overflow-hidden">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Monthly Revenue</p>
                <p className="text-lg sm:text-2xl font-bold text-primary mt-1">
                  {formatCurrency(stats.estimatedRevenue)}
                </p>
                <div className={`flex items-center gap-1 mt-1 text-xs ${stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.revenueGrowth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  <span>{Math.abs(stats.revenueGrowth).toFixed(0)}% vs last month</span>
                </div>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shrink-0">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Appointments</p>
                <p className="text-lg sm:text-2xl font-bold text-primary mt-1">{stats.totalThisMonth}</p>
                <div className={`flex items-center gap-1 mt-1 text-xs ${stats.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.growthRate >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  <span>{Math.abs(stats.growthRate).toFixed(0)}% growth</span>
                </div>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shrink-0">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-lg sm:text-2xl font-bold text-primary mt-1">
                  {stats.totalThisMonth > 0 ? ((stats.completedThisMonth / stats.totalThisMonth) * 100).toFixed(0) : 0}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.completedThisMonth} completed
                </p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shrink-0">
                <Target className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Clinic Rating</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500 fill-amber-500" />
                  <span className="text-lg sm:text-2xl font-bold">{clinicRating.toFixed(1)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.cancelledRate.toFixed(0)}% cancel rate
                </p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shrink-0">
                <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Appointments Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Appointments Trend
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Last 14 days activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] sm:h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="shortDate" 
                    tick={{ fontSize: 11 }} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }} 
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-popover border border-border rounded-lg p-2 shadow-lg text-sm">
                            <p className="font-medium">{payload[0]?.payload?.date}</p>
                            <p className="text-primary">Total: {payload[0]?.value}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Status Distribution
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">All time appointments by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] sm:h-[250px] flex items-center justify-center">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-sm">No appointment data</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Pet Types */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Pet Types
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Distribution of pet visits</CardDescription>
          </CardHeader>
          <CardContent>
            {petTypeData.length > 0 ? (
              <div className="space-y-3">
                {petTypeData.map((pet, index) => {
                  const maxValue = Math.max(...petTypeData.map(p => p.value));
                  const percentage = (pet.value / maxValue) * 100;
                  return (
                    <div key={pet.name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{pet.name}</span>
                        <span className="text-muted-foreground">{pet.value} visits</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">No pet data available</p>
            )}
          </CardContent>
        </Card>

        {/* Doctor Performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Stethoscope className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Doctor Performance
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Appointments by doctor</CardDescription>
          </CardHeader>
          <CardContent>
            {doctorPerformance.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={doctorPerformance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      tick={{ fontSize: 11 }} 
                      width={60}
                    />
                    <Tooltip />
                    <Bar dataKey="completed" fill="hsl(142.1, 76.2%, 36.3%)" name="Completed" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="appointments" fill="hsl(var(--primary))" name="Total" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">No doctor data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">Pending</p>
          <p className="text-xl font-bold text-amber-600">{stats.pendingCount}</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">Active Doctors</p>
          <p className="text-xl font-bold text-primary">{doctors.filter(d => d.doctor?.is_available).length}</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">Active Services</p>
          <p className="text-xl font-bold text-primary">{services.filter(s => s.is_active).length}</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">Avg per Doctor</p>
          <p className="text-xl font-bold text-primary">{stats.avgAppointmentsPerDoctor.toFixed(1)}</p>
        </div>
      </div>
    </div>
  );
};

export default ClinicAnalyticsCharts;
