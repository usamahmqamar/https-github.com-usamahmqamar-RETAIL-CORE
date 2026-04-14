import React, { useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { Calendar, Filter, Download, ChevronDown, TrendingUp } from 'lucide-react';
import { fetchSalesAnalyticsData } from '../services/api';
import { SalesAnalyticsData } from '../types';
import { motion } from 'motion/react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const SalesAnalytics: React.FC = () => {
  const [data, setData] = useState<SalesAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('Last 30 Days');

  useEffect(() => {
    const loadData = async () => {
      const result = await fetchSalesAnalyticsData();
      setData(result);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8" id="sales-analytics-module">
      {/* Filters & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <button className="flex items-center gap-2 px-4 py-2 bg-[var(--ink)]/5 border border-[var(--line)] rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-700 hover:bg-[var(--ink)]/10 transition-all">
              <Calendar className="w-4 h-4 text-gray-500" />
              {dateRange}
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--ink)]/5 border border-[var(--line)] rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-700 hover:bg-[var(--ink)]/10 transition-all">
            <Filter className="w-4 h-4 text-gray-500" />
            More Filters
          </button>
        </div>
        <button className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Main Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Sales */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-bold text-[var(--ink)] uppercase tracking-widest">Daily Sales (Last 7 Days)</h3>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.dailySales}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 600}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 600}} tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Sales']} 
                />
                <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Monthly Sales */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-bold text-[var(--ink)] uppercase tracking-widest">Monthly Sales (Last 12 Months)</h3>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlySales}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 600}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 600}} tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Sales']} 
                />
                <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Breakdown Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Yearly Overview */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <h3 className="text-[10px] font-bold text-[var(--ink)] uppercase tracking-widest mb-6">Yearly Overview</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.yearlySales} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="year" type="category" axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 10, fontWeight: 700}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)' }}
                  formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Sales']} 
                />
                <Bar dataKey="sales" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Channel Breakdown */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <h3 className="text-[10px] font-bold text-[var(--ink)] uppercase tracking-widest mb-6">Online vs In-store</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.channelBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.channelBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Payment Breakdown */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <h3 className="text-[10px] font-bold text-[var(--ink)] uppercase tracking-widest mb-6">Payment Methods</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.paymentBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.paymentBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
