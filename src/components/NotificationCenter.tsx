import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  Package, 
  TrendingDown, 
  Clock, 
  X, 
  CheckCircle2,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchDashboardAlerts } from '../services/api';
import { DashboardAlert } from '../types';
import { cn } from '../lib/utils';

interface NotificationCenterProps {
  onNavigate: (tab: any) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onNavigate }) => {
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const result = await fetchDashboardAlerts();
      setAlerts(result);
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = alerts.filter(a => !a.isRead).length;

  const markAsRead = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
  };

  const markAllAsRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'out-of-stock': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'low-stock': return <Package className="w-4 h-4 text-amber-500" />;
      case 'expiring-soon': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'high-refunds': return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'negative-profit': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 border-red-100';
      case 'high': return 'bg-amber-50 border-amber-100';
      case 'medium': return 'bg-blue-50 border-blue-100';
      default: return 'bg-gray-50 border-gray-100';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 rounded-xl transition-all",
          isOpen ? "bg-blue-50 text-blue-600" : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
        )}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                Notifications
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                    {unreadCount} New
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[11px] font-bold text-blue-600 hover:underline"
                  >
                    Mark all as read
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto no-scrollbar">
              {loading ? (
                <div className="p-8 text-center">
                  <Clock className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-gray-400">Fetching alerts...</p>
                </div>
              ) : alerts.length === 0 ? (
                <div className="p-12 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium text-gray-900">All caught up!</p>
                  <p className="text-xs text-gray-400 mt-1">No active alerts for your business.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {alerts.map((alert) => (
                    <div 
                      key={alert.id}
                      onClick={() => {
                        markAsRead(alert.id);
                        onNavigate(alert.targetTab);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "p-4 hover:bg-gray-50 transition-colors cursor-pointer group relative",
                        !alert.isRead && "bg-blue-50/30"
                      )}
                    >
                      {!alert.isRead && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                      )}
                      <div className="flex gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
                          getSeverityColor(alert.severity)
                        )}>
                          {getAlertIcon(alert.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h4 className={cn(
                              "text-sm font-bold truncate pr-4",
                              alert.isRead ? "text-gray-700" : "text-gray-900"
                            )}>
                              {alert.title}
                            </h4>
                            <span className="text-[10px] text-gray-400 whitespace-nowrap">
                              {formatTimestamp(alert.timestamp)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                            {alert.message}
                          </p>
                          <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-blue-600 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                            View Details <ChevronRight className="w-3 h-3" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-gray-50 bg-gray-50/30 text-center">
              <button className="text-[11px] font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest">
                Notification Settings
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
