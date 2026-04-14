import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { motion } from 'motion/react';
import { KPIData } from '../types';
import { cn } from '../lib/utils';

interface KPICardProps {
  data: KPIData;
  className?: string;
  isExpense?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({ data, className, isExpense = false }) => {
  const { label, value, previousValue, unit, trend } = data;
  
  const percentageChange = previousValue !== 0 
    ? ((value - previousValue) / previousValue) * 100 
    : 0;
  
  const formattedValue = unit === 'currency' 
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)
    : new Intl.NumberFormat('en-IN').format(value);

  // For expenses, a "down" trend is positive (green)
  const isPositiveTrend = isExpense ? trend === 'down' : trend === 'up';
  const isNegativeTrend = isExpense ? trend === 'up' : trend === 'down';

  return (
    <div className={cn(
      "p-6 glass-card flex flex-col gap-2 transition-all hover:shadow-md group",
      className
    )} id={`kpi-card-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <span className="kpi-label">{label}</span>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="kpi-value">{formattedValue}</h2>
        <div className={cn(
          "flex items-center text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-widest",
          isPositiveTrend && "text-emerald-600 bg-emerald-500/10",
          isNegativeTrend && "text-rose-600 bg-rose-500/10",
          trend === 'neutral' && "text-slate-500 bg-slate-500/10"
        )}>
          {trend === 'up' && <ArrowUpRight className="w-3 h-3 mr-1" />}
          {trend === 'down' && <ArrowDownRight className="w-3 h-3 mr-1" />}
          {trend === 'neutral' && <Minus className="w-3 h-3 mr-1" />}
          {Math.abs(percentageChange).toFixed(1)}%
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <div className="h-1 flex-1 bg-[var(--ink)]/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(0, 50 + percentageChange))}%` }}
            className={cn(
              "h-full transition-all duration-1000",
              isPositiveTrend ? "bg-emerald-500" : isNegativeTrend ? "bg-rose-500" : "bg-slate-400"
            )}
          />
        </div>
        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap uppercase tracking-widest">vs. prev</span>
      </div>
    </div>
  );
};
