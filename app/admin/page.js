"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  Users, 
  HeartHandshake, 
  ShoppingBag, 
  CalendarDays, 
  DollarSign, 
  ArrowRight,
  Loader2,
  FileSpreadsheet,
  Search,
  Filter,
  TrendingUp,
  PieChart as PieChartIcon,
  Trophy
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { toast } from "sonner";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

export default function AdminDashboard() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [timeFilter, setTimeFilter] = useState("monthly"); // "weekly", "monthly", "yearly"

  useEffect(() => {
    async function fetchData() {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        
        const [statsRes, ordersRes, docsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/orders`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/doctors`, { headers })
        ]);

        if (!statsRes.ok || !ordersRes.ok || !docsRes.ok) {
          throw new Error("Failed to fetch dashboard data.");
        }

        const statsData = await statsRes.json();
        const ordersData = await ordersRes.json();
        const docsData = await docsRes.json();

        setStats(statsData.stats);
        setOrders(ordersData);
        setDoctors(docsData);
      } catch (err) {
        console.warn(err);
        toast.error("Could not load dashboard statistics.");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchData();
    }
  }, [token]);

  // Use Memo for complex calculations
  const chartData = useMemo(() => {
    if (!orders.length) return [];
    
    const map = new Map();
    const now = new Date();

    orders.forEach(o => {
      if (['pending_payment', 'failed_payment', 'draft'].includes(o.status)) return;
      
      const d = new Date(o.created_at);
      let key = "";
      
      if (timeFilter === "weekly") {
        // group by Date for the last 14 days
        const diffTime = Math.abs(now - d);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        if (diffDays > 14) return;
        key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (timeFilter === "monthly") {
        // Last 12 months
        const diffMonths = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth();
        if (diffMonths > 12) return;
        key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      } else if (timeFilter === "yearly") {
        key = d.getFullYear().toString();
      }

      if (!map.has(key)) {
        map.set(key, { name: key, revenue: 0, orders: 0, timestamp: d.getTime() });
      }
      const entry = map.get(key);
      entry.revenue += (o.total_cents / 100);
      entry.orders += 1;
    });

    return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
  }, [orders, timeFilter]);

  const statusDistribution = useMemo(() => {
     const map = new Map();
     orders.forEach(o => {
        if (['pending_payment', 'failed_payment', 'draft'].includes(o.status)) return;
        const s = o.status.replace(/_/g, ' ').toUpperCase();
        map.set(s, (map.get(s) || 0) + 1);
     });
     return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [orders]);

  const topDoctors = useMemo(() => {
     const map = new Map();
     orders.forEach(o => {
        if (['pending_payment', 'failed_payment', 'draft', 'cancelled'].includes(o.status)) return;
        if (!map.has(o.doctor_id)) {
           map.set(o.doctor_id, {
              id: o.doctor_id,
              name: `Dr. ${o.doctor_first_name} ${o.doctor_last_name}`,
              practice: o.doctor_practice,
              revenue: 0,
              orders: 0
           });
        }
        const entry = map.get(o.doctor_id);
        entry.revenue += (o.total_cents / 100);
        entry.orders += 1;
     });
     return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [orders]);

  const recentOrdersList = orders.filter(o => 
     !['pending_payment', 'failed_payment', 'draft'].includes(o.status)
  ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

  const formatPrice = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatPriceCents = (cents) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(cents / 100);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "submitted_warehouse":
      case "confirmed":
      case "delivered":
        return "bg-green-50 text-green-700";
      case "returned":
      case "return_requested":
      case "return_approved":
        return "bg-brand-burgundy/10 text-brand-burgundy";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const formatStatus = (status) => {
    if (!status) return "";
    if (status === 'return_approved') return 'Approved';
    if (status === 'returned') return 'Returned';
    if (status === 'refunded') return 'Refunded';
    if (status === 'submitted_warehouse') return 'Submitted';
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Mockup-specific chart colors
  const PIE_COLORS = {
    'RETURNED': '#812434', // brand-burgundy
    'SUBMITTED WAREHOUSE': '#22c55e', // green
    'DELIVERED': '#22c55e',
    'CONFIRMED': '#10b981',
    'DEFAULT': '#94a3b8'
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-burgundy animate-spin" />
          <p className="text-slate-500 text-xs font-bold tracking-wider">Loading analytics engine...</p>
        </div>
      </div>
    );
  }

  // Get pie chart summaries (Returned vs Submitted) for footer
  const returnedCount = statusDistribution.find(s => s.name === 'RETURNED')?.value || 0;
  const submittedCount = statusDistribution.find(s => s.name === 'SUBMITTED WAREHOUSE' || s.name === 'CONFIRMED')?.value || 0;

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-[1400px] mx-auto">
      {/* Page Header */}
      <div>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">System Administration</p>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Analytics & Control Center</h1>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col items-start gap-3 shadow-sm">
          <div className="flex items-center gap-3 w-full">
            <div className="w-10 h-10 rounded-full bg-brand-burgundy/10 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-brand-burgundy" />
            </div>
            <div>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">TOTAL REPS</span>
              <span className="text-2xl font-black text-slate-900 leading-none">{stats?.totalReps || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col items-start gap-3 shadow-sm">
          <div className="flex items-center gap-3 w-full">
            <div className="w-10 h-10 rounded-full bg-brand-burgundy/10 flex items-center justify-center shrink-0">
              <HeartHandshake className="w-4 h-4 text-brand-burgundy" />
            </div>
            <div>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">TOTAL DOCTORS</span>
              <span className="text-2xl font-black text-slate-900 leading-none">{stats?.totalDoctors || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col items-start gap-3 shadow-sm">
          <div className="flex items-center gap-3 w-full">
            <div className="w-10 h-10 rounded-full bg-brand-burgundy/10 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4 text-brand-burgundy" />
            </div>
            <div>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">ORDERS TODAY</span>
              <span className="text-2xl font-black text-slate-900 leading-none">{stats?.ordersToday || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col items-start gap-3 shadow-sm">
          <div className="flex items-center gap-3 w-full">
            <div className="w-10 h-10 rounded-full bg-brand-burgundy/10 flex items-center justify-center shrink-0">
              <CalendarDays className="w-4 h-4 text-brand-burgundy" />
            </div>
            <div>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">ORDERS (MTH)</span>
              <span className="text-2xl font-black text-slate-900 leading-none">{stats?.ordersThisMonth || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col items-start gap-3 shadow-sm">
          <div className="flex items-center gap-3 w-full">
            <div className="w-10 h-10 rounded-full bg-brand-burgundy/10 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4 text-brand-burgundy" />
            </div>
            <div>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">REVENUE (MTH)</span>
              <span className="text-2xl font-black text-slate-900 leading-none">{formatPriceCents(stats?.revenueThisMonthCents || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Area */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col p-6 h-[400px]">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-burgundy" />
              Global Revenue Trends
            </h2>
            
            <div className="flex bg-white border border-slate-200 p-0.5 rounded-lg overflow-hidden">
              {['weekly', 'monthly', 'yearly'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={`px-4 py-1.5 text-[11px] font-bold capitalize transition-colors ${
                    timeFilter === filter 
                      ? "bg-brand-burgundy text-white rounded-md shadow-sm" 
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 w-full relative min-h-0 mb-4">
             {chartData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                   <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(value) => `₹${value/1000}k`} />
                   <Tooltip 
                     cursor={{ fill: '#f8fafc' }}
                     contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                     labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}
                     formatter={(value, name) => [name === 'revenue' ? formatPrice(value) : value, 'Revenue']}
                   />
                   <Bar yAxisId="left" dataKey="revenue" fill="#812434" radius={[4, 4, 0, 0]} maxBarSize={40} />
                 </BarChart>
               </ResponsiveContainer>
             ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs font-semibold">
                   No data available for this timeframe.
                </div>
             )}
          </div>

          <div className="flex justify-between items-end border-t border-slate-100 pt-4 mt-auto">
             <div>
                <span className="text-[10px] font-bold text-slate-500 mb-1 block">This Month Revenue</span>
                <span className="text-xl font-extrabold text-slate-900">{formatPriceCents(stats?.revenueThisMonthCents || 0)}</span>
             </div>
             <div className="text-right">
                <span className="text-[10px] font-bold text-slate-500 mb-1 block">Growth</span>
                <span className="text-xs font-extrabold text-brand-burgundy flex items-center gap-0.5 justify-end">
                   ↑ 100%
                </span>
             </div>
          </div>
        </div>

        {/* Status Distribution Pie */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col p-6 h-[400px]">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 mb-1">
            <PieChartIcon className="w-4 h-4 text-brand-burgundy" />
            Order Fulfillment Status
          </h2>
          <p className="text-[9px] text-slate-400 font-medium mb-6">Breakdown of all active and historical orders.</p>
          
          <div className="flex-1 w-full relative min-h-0 flex items-center justify-center mb-6">
             {statusDistribution.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={statusDistribution}
                     cx="50%"
                     cy="50%"
                     innerRadius={65}
                     outerRadius={95}
                     paddingAngle={2}
                     dataKey="value"
                     stroke="none"
                   >
                     {statusDistribution.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name] || PIE_COLORS['DEFAULT']} />
                     ))}
                   </Pie>
                   <Tooltip 
                     contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                     itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                   />
                 </PieChart>
               </ResponsiveContainer>
             ) : (
                <div className="text-slate-400 text-xs font-semibold">No active orders</div>
             )}
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 mt-auto">
             <div className="text-center border-r border-slate-100">
                <span className="text-lg font-black text-slate-900 block leading-none mb-1">{returnedCount}</span>
                <span className="text-[10px] font-bold text-brand-burgundy">Returned</span>
             </div>
             <div className="text-center">
                <span className="text-lg font-black text-slate-900 block leading-none mb-1">{submittedCount}</span>
                <span className="text-[10px] font-bold text-green-600">Submitted</span>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Orders searchable */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[400px]">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
             <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
               <FileSpreadsheet className="w-4 h-4 text-brand-burgundy" />
               Recent Order Auditing
             </h2>
             <Link href="/admin/orders" className="px-3 py-1 text-[10px] font-bold text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors">
                View All
             </Link>
          </div>
          
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-white sticky top-0 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider">ORDER ID</th>
                  <th className="px-5 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider">DATE</th>
                  <th className="px-5 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider">DOCTOR</th>
                  <th className="px-5 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider">STATUS</th>
                  <th className="px-5 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider text-right">AMOUNT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrdersList.map((order, idx) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-extrabold text-slate-800">{order.order_number}</td>
                    <td className="px-5 py-4 text-slate-600 font-semibold">{new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="px-5 py-4 text-slate-800 font-bold">Dr. {order.doctor_first_name} {order.doctor_last_name}</td>
                    <td className="px-5 py-4">
                       <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                         {formatStatus(order.status)}
                       </span>
                    </td>
                    <td className="px-5 py-4 text-right font-black text-slate-900">{formatPriceCents(order.total_cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentOrdersList.length === 0 && (
               <div className="p-8 text-center text-slate-400 text-xs font-semibold">No recent orders found.</div>
            )}
          </div>
        </div>

        {/* Top Doctors Leaderboard */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[400px]">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
             <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
               <Trophy className="w-4 h-4 text-brand-burgundy" />
               Top Performing Doctors
             </h2>
             <Link href="/admin/doctors" className="px-3 py-1 text-[10px] font-bold text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors">
                View All
             </Link>
          </div>
          
          <div className="overflow-y-auto flex-1 p-3">
             <div className="space-y-1">
               {topDoctors.map((doc, idx) => (
                 <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-4">
                       <div className="w-8 h-8 rounded-full bg-brand-burgundy/10 text-brand-burgundy flex items-center justify-center text-xs font-black shrink-0">
                          {idx + 1}
                       </div>
                       <div>
                          <p className="text-xs font-bold text-slate-900">{doc.name}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-xs font-black text-slate-900">{formatPrice(doc.revenue)}</p>
                    </div>
                 </div>
               ))}
               {topDoctors.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-xs font-semibold">No doctors found.</div>
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
