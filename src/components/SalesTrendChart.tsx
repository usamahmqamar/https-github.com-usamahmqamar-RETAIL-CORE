import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { SalesTrend } from '../types';

interface SalesTrendChartProps {
  data: SalesTrend[];
}

export const SalesTrendChart: React.FC<SalesTrendChartProps> = ({ data }) => {
  return (
    <div className="glass-card p-8 h-[450px] transition-all hover:shadow-lg" id="sales-trend-chart-container">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Revenue Performance</h3>
          <p className="text-2xl font-bold text-[var(--ink)] tracking-tight">Sales Trend (Last 7 Days)</p>
        </div>
        <div className="flex items-center gap-4 bg-[var(--ink)]/5 px-4 py-2 rounded-xl border border-[var(--line)]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Revenue</span>
          </div>
        </div>
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
              dy={15}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
              tickFormatter={(value) => `₹${value / 1000}k`}
              dx={-10}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                backdropFilter: 'blur(8px)',
                borderRadius: '16px', 
                border: '1px solid rgba(0, 0, 0, 0.1)',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                padding: '12px'
              }}
              itemStyle={{ fontSize: '12px', fontWeight: 900, color: '#0f172a' }}
              labelStyle={{ fontSize: '10px', fontWeight: 700, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
              formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'REVENUE']}
            />
            <Area 
              type="monotone" 
              dataKey="sales" 
              stroke="#3b82f6" 
              strokeWidth={4}
              fillOpacity={1} 
              fill="url(#colorSales)" 
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
