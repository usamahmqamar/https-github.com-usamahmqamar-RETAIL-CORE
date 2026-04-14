import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Target, 
  Zap, 
  ShieldCheck, 
  ArrowUpRight, 
  BarChart, 
  LineChart as LineChartIcon,
  Calendar,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  ComposedChart, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  ReferenceLine
} from 'recharts';
import { fetchForecastData } from '../services/api';
import { ForecastData } from '../types';
import { cn } from '../lib/utils';

export const SalesForecasting = () => {
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadForecast = async () => {
    setLoading(true);
    try {
      const result = await fetchForecastData();
      setData(result);
    } catch (error) {
      console.error("Failed to fetch forecast data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForecast();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Zap className="w-8 h-8 text-blue-500 animate-pulse" />
        <p className="text-gray-400 text-sm animate-pulse">Running AI Projections...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Forecast Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase tracking-wider">Target</span>
          </div>
          <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest">Expected Sales</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">₹{data.expectedMonthlySales.toLocaleString('en-IN')}</p>
          <div className="mt-2 flex items-center gap-1 text-emerald-600 text-xs font-bold">
            <ArrowUpRight className="w-3 h-3" />
            +{data.growthRate}% Projection
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-wider">Estimated</span>
          </div>
          <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest">Expected Profit</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">₹{data.expectedMonthlyProfit.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-gray-400 mt-2">Based on current margin trends</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-50 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full uppercase tracking-wider">Reliability</span>
          </div>
          <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest">Confidence Score</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{data.confidenceScore}%</p>
          <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-purple-500 h-full" style={{ width: `${data.confidenceScore}%` }} />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-blue-600 p-6 rounded-2xl shadow-lg shadow-blue-100 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
          </div>
          <h3 className="text-blue-100 text-xs font-bold uppercase tracking-widest">AI Insight</h3>
          <p className="text-sm font-medium mt-2 leading-relaxed">
            Sales are projected to peak in June. Consider increasing inventory for high-margin items by late May.
          </p>
        </motion.div>
      </div>

      {/* Projection Chart */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <LineChartIcon className="w-5 h-5 text-blue-600" />
              Sales & Profit Projection
            </h2>
            <p className="text-xs text-gray-400 mt-1">Historical data vs. AI-driven future estimates</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Actual Sales</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-300 border-2 border-dashed border-blue-500" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Forecast Sales</span>
            </div>
          </div>
        </div>

        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data.projectionTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis 
                dataKey="period" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }}
                tickFormatter={(value) => `₹${value / 1000}k`}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, '']}
              />
              <Legend verticalAlign="top" align="right" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }} />
              
              <Area 
                type="monotone" 
                dataKey="actualSales" 
                fill="#3B82F6" 
                fillOpacity={0.1} 
                stroke="none" 
                name="Actual Sales"
              />
              <Area 
                type="monotone" 
                dataKey="forecastSales" 
                fill="#3B82F6" 
                fillOpacity={0.05} 
                stroke="none" 
                strokeDasharray="5 5"
                name="Forecast Sales"
              />
              
              <Line 
                type="monotone" 
                dataKey="actualSales" 
                stroke="#3B82F6" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6 }}
                name="Actual Sales"
              />
              <Line 
                type="monotone" 
                dataKey="forecastSales" 
                stroke="#3B82F6" 
                strokeWidth={3} 
                strokeDasharray="8 4"
                dot={{ r: 4, fill: '#fff', strokeWidth: 2, stroke: '#3B82F6' }}
                name="Forecast Sales"
              />
              
              <Line 
                type="monotone" 
                dataKey="actualProfit" 
                stroke="#10B981" 
                strokeWidth={2} 
                dot={{ r: 3, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }}
                name="Actual Profit"
              />
              <Line 
                type="monotone" 
                dataKey="forecastProfit" 
                stroke="#10B981" 
                strokeWidth={2} 
                strokeDasharray="8 4"
                dot={{ r: 3, fill: '#fff', strokeWidth: 2, stroke: '#10B981' }}
                name="Forecast Profit"
              />

              <ReferenceLine x="Mar 26" stroke="#94A3B8" strokeDasharray="3 3" label={{ position: 'top', value: 'TODAY', fill: '#94A3B8', fontSize: 10, fontWeight: 'bold' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Planning Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            Planning Recommendations
          </h3>
          <div className="space-y-4">
            {[
              { title: 'Inventory Buffer', desc: 'Increase stock for "Premium Wireless Headphones" by 20% to meet May demand.', type: 'inventory' },
              { title: 'Staffing Adjustment', desc: 'Consider hiring 1 additional floor staff for the projected June peak.', type: 'staff' },
              { title: 'Marketing Spend', desc: 'Maintain current spend; ROI is projected to stabilize in April.', type: 'marketing' }
            ].map((rec, i) => (
              <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-1 h-full bg-blue-500 rounded-full" />
                <div>
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">{rec.title}</h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{rec.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Info className="w-4 h-4 text-gray-400" />
            Forecast Methodology
          </h3>
          <div className="space-y-3">
            <p className="text-xs text-gray-500 leading-relaxed">
              Our forecasting model uses a combination of **Exponential Smoothing** and **Linear Regression** based on your last 12 months of historical data.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Seasonality</p>
                <p className="text-xs font-medium text-blue-900 mt-1">High Impact</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Trend Factor</p>
                <p className="text-xs font-medium text-emerald-900 mt-1">Positive (+12%)</p>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 italic mt-4">
              * Forecasts are updated daily as new sales data is recorded. Accuracy improves with more historical data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
