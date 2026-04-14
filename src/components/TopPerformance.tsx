import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  IndianRupee, 
  Package, 
  ArrowUpRight, 
  ArrowDownRight,
  Minus,
  Search,
  Filter,
  Medal,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchTopPerformanceData } from '../services/api';
import { TopPerformanceData, PerformanceProduct } from '../types';
import { cn } from '../lib/utils';

export const TopPerformance = () => {
  const [data, setData] = useState<TopPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'selling' | 'profitable' | 'worst'>('selling');
  const [searchTerm, setSearchTerm] = useState('');

  const loadPerformanceData = async () => {
    setLoading(true);
    try {
      const result = await fetchTopPerformanceData();
      setData(result);
    } catch (error) {
      console.error("Failed to fetch performance data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const getActiveList = () => {
    if (!data) return [];
    switch (activeView) {
      case 'selling': return data.topSelling;
      case 'profitable': return data.mostProfitable;
      case 'worst': return data.worstPerforming;
      default: return [];
    }
  };

  const filteredList = getActiveList().filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUpRight className="w-4 h-4 text-emerald-500" />;
      case 'down': return <ArrowDownRight className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Trophy className="w-8 h-8 text-blue-500 animate-bounce" />
        <p className="text-gray-400 text-sm animate-pulse">Analyzing performance data...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-[var(--ink)]/5 p-1 rounded-xl border border-[var(--line)]">
          <button 
            onClick={() => setActiveView('selling')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
              activeView === 'selling' ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
            )}
          >
            <Package className="w-4 h-4" />
            Top Selling
          </button>
          <button 
            onClick={() => setActiveView('profitable')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
              activeView === 'profitable' ? "bg-emerald-600 text-white shadow-md shadow-emerald-100" : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
            )}
          >
            <IndianRupee className="w-4 h-4" />
            Most Profitable
          </button>
          <button 
            onClick={() => setActiveView('worst')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
              activeView === 'worst' ? "bg-red-600 text-white shadow-md shadow-red-100" : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
            )}
          >
            <TrendingDown className="w-4 h-4" />
            Worst Performing
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white border border-[var(--line)] rounded-xl text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-full md:w-64 placeholder:text-gray-300"
          />
        </div>
      </div>

      {/* Performance List */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--ink)]/5 border-b border-[var(--line)]">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rank</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Product Info</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Sales</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Revenue</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Profit</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Margin</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              <AnimatePresence mode="popLayout">
                {filteredList.map((product, index) => (
                  <motion.tr 
                    key={product.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    className="group hover:bg-[var(--ink)]/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--ink)]/5 text-[10px] font-bold text-gray-500 border border-[var(--line)]">
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-bold text-[var(--ink)] group-hover:text-blue-600 transition-colors">{product.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{product.sku}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-300" />
                          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{product.category}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-[var(--ink)]">{product.salesCount.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-[var(--ink)]">₹{product.revenue.toLocaleString('en-IN')}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={cn(
                        "text-sm font-bold",
                        product.profit >= 0 ? "text-emerald-600" : "text-red-600"
                      )}>
                        {product.profit < 0 ? '-' : ''}₹{Math.abs(product.profit).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-bold text-[var(--ink)]">{product.margin}%</span>
                        <div className="w-16 bg-[var(--ink)]/5 h-1 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full transition-all duration-500",
                              product.margin > 40 ? "bg-emerald-500" : product.margin > 20 ? "bg-blue-500" : "bg-red-500"
                            )} 
                            style={{ width: `${Math.max(0, Math.min(100, product.margin))}%` }} 
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        {getTrendIcon(product.trend)}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        
        {filteredList.length === 0 && (
          <div className="p-12 text-center">
            <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No products found matching your search.</p>
          </div>
        )}
      </div>

      {/* Summary Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Medal className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-[10px] font-bold text-[var(--ink)] uppercase tracking-widest">Top Performer</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            <span className="font-bold text-[var(--ink)]">{data.topSelling[0].name}</span> is your overall winner with the highest sales volume and a healthy {data.topSelling[0].margin}% margin.
          </p>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-[10px] font-bold text-[var(--ink)] uppercase tracking-widest">Profit Driver</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            <span className="font-bold text-[var(--ink)]">{data.mostProfitable[0].name}</span> contributes the most to your bottom line, generating ₹{data.mostProfitable[0].profit.toLocaleString('en-IN')} in net profit.
          </p>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-[10px] font-bold text-[var(--ink)] uppercase tracking-widest">Action Required</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            <span className="font-bold text-[var(--ink)]">{data.worstPerforming[0].name}</span> is currently underperforming. Consider a clearance sale or discontinuing this item.
          </p>
        </div>
      </div>
    </div>
  );
};
