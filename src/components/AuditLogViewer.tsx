import React, { useEffect, useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Activity, 
  ChevronDown,
  Download,
  AlertCircle
} from 'lucide-react';
import { fetchAuditLogs } from '../services/api';
import { AuditLog } from '../types';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await fetchAuditLogs();
      setLogs(data);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.module.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="audit-log-viewer">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <History className="w-6 h-6 text-blue-600" />
            Audit Logs
          </h2>
          <p className="text-sm text-gray-500 mt-1">Track critical system actions and user activities</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
        >
          <Download className="w-4 h-4" />
          Export Logs
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex flex-col md:flex-row gap-4 justify-between bg-gray-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs by user, action, or module..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
              <Calendar className="w-4 h-4" />
              Date Range
              <ChevronDown className="w-4 h-4" />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
              <Filter className="w-4 h-4" />
              Module
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Timestamp</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Action</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Module</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900">{format(new Date(log.timestamp), 'MMM dd, yyyy')}</span>
                      <span className="text-xs text-gray-500">{format(new Date(log.timestamp), 'hh:mm:ss a')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs">
                        {log.userName.charAt(0)}
                      </div>
                      <span className="text-sm font-bold text-gray-700">{log.userName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold flex items-center gap-1 w-fit">
                      <Activity className="w-3 h-3" />
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold uppercase tracking-wider">
                      {log.module}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600 max-w-xs truncate" title={log.details}>
                      {log.details}
                    </p>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="w-8 h-8 text-gray-300" />
                      <p className="font-bold">No logs found matching your search</p>
                      <p className="text-sm">Try adjusting your filters or search term</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
