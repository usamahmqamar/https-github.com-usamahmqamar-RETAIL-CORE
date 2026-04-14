import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  IndianRupee, 
  Receipt, 
  Undo2, 
  PieChart as PieChartIcon,
  BarChart3
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  ComposedChart,
  Line,
  Area
} from 'recharts';
import { fetchProfitLossData, hasPermission } from '../services/api';
import { ProfitLossData, User as UserType } from '../types';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface ProfitLossProps {
  currentUser: UserType | null;
}

export const ProfitLoss: React.FC<ProfitLossProps> = ({ currentUser }) => {
  const [data, setData] = useState<ProfitLossData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'daily' | 'monthly'>('monthly');

  useEffect(() => {
    const loadData = async () => {
      const result = await fetchProfitLossData();
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

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

  const stats = [
    { label: 'Total Revenue', value: data.totalRevenue, icon: IndianRupee, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'COGS', value: data.cogs, icon: PieChartIcon, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Expenses', value: data.expenses, icon: Receipt, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Refunds', value: data.refunds, icon: Undo2, color: 'text-gray-600', bg: 'bg-gray-50' },
  ];

  const trendData = timeframe === 'daily' ? data.dailyTrend : data.monthlyTrend;

  return (
    <div className="space-y-8" id="profit-loss-module">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className={cn("p-3 rounded-xl", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">{stat.label}</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{formatCurrency(stat.value)}</h2>
          </motion.div>
        ))}
      </div>

      {/* Net Profit Highlight */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-blue-600 rounded-2xl p-8 text-white shadow-xl shadow-blue-100 flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <div>
          <p className="text-blue-100 font-medium uppercase tracking-widest text-sm mb-2">Net Profit (Current Month)</p>
          <h2 className="text-5xl font-bold">{formatCurrency(data.netProfit)}</h2>
          <div className="flex items-center gap-2 mt-4 text-blue-100">
            <TrendingUp className="w-5 h-5" />
            <span className="font-medium">+12.5% from last month</span>
          </div>
        </div>
        <div className="hidden md:block h-24 w-px bg-blue-500/50"></div>
        <div className="grid grid-cols-2 gap-8 w-full md:w-auto">
          <div>
            <p className="text-blue-200 text-xs uppercase mb-1">Profit Margin</p>
            <p className="text-2xl font-bold">
              {data.totalRevenue > 0 ? ((data.netProfit / data.totalRevenue) * 100).toFixed(1) : '0.0'}%
            </p>
          </div>
          <div>
            <p className="text-blue-200 text-xs uppercase mb-1">Operating Ratio</p>
            <p className="text-2xl font-bold">
              {data.totalRevenue > 0 ? (((data.cogs + data.expenses + data.refunds) / data.totalRevenue) * 100).toFixed(1) : '0.0'}%
            </p>
          </div>
        </div>
      </motion.div>

      {/* Trend Chart */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Profitability Trends
            </h3>
            <p className="text-sm text-gray-500 mt-1">Comparing revenue and net profit over time</p>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button 
              onClick={() => setTimeframe('daily')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                timeframe === 'daily' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              Daily
            </button>
            <button 
              onClick={() => setTimeframe('monthly')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                timeframe === 'monthly' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              Monthly
            </button>
          </div>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trendData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis 
                dataKey="period" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                tickFormatter={(v) => `₹${v >= 1000 ? v/1000 + 'k' : v}`}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(v: number) => [formatCurrency(v), '']}
              />
              <Legend verticalAlign="top" align="right" height={36} />
              <Area type="monotone" dataKey="revenue" fill="url(#colorRevenue)" stroke="none" />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={timeframe === 'monthly' ? 40 : 20} opacity={0.2} />
              <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdown Table (Simplified) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold">P&L Breakdown</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center py-2 border-b border-gray-50">
            <span className="text-gray-600">Gross Revenue</span>
            <span className="font-bold text-gray-900">{formatCurrency(data.totalRevenue + data.refunds)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-50">
            <span className="text-gray-600">Refunds & Returns</span>
            <span className="font-bold text-rose-600">({formatCurrency(data.refunds)})</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-50 bg-gray-50 px-2 rounded-lg">
            <span className="font-semibold text-gray-900">Net Revenue</span>
            <span className="font-bold text-gray-900">{formatCurrency(data.totalRevenue)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-50">
            <span className="text-gray-600">Cost of Goods Sold (COGS)</span>
            <span className="font-bold text-amber-600">({formatCurrency(data.cogs)})</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-50 bg-gray-50 px-2 rounded-lg">
            <span className="font-semibold text-gray-900">Gross Profit</span>
            <span className="font-bold text-emerald-600">{formatCurrency(data.totalRevenue - data.cogs)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-50">
            <span className="text-gray-600">Operating Expenses</span>
            <span className="font-bold text-rose-600">({formatCurrency(data.expenses)})</span>
          </div>
          <div className="flex justify-between items-center py-4 bg-blue-50 px-4 rounded-xl">
            <span className="font-bold text-blue-900 text-lg">Net Profit</span>
            <span className="font-black text-blue-900 text-2xl">{formatCurrency(data.netProfit)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
