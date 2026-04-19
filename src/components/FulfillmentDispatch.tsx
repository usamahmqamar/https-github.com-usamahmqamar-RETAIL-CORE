import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Package, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  Search,
  ChevronRight,
  Filter,
  ExternalLink,
  MoreVertical,
  Loader2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Order, User } from '../types';
import { fetchOnlineOrders, updateOrderFulfillmentStatus } from '../services/api';

interface FulfillmentDispatchProps {
  currentUser: User | null;
}

const FulfillmentDispatch: React.FC<FulfillmentDispatchProps> = ({ currentUser }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateNote, setUpdateNote] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchOnlineOrders();
      setOrders(data);
    } catch (error) {
      console.error('Failed to load online orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: Order['fulfillmentStatus']) => {
    if (!selectedOrder) return;
    setUpdating(true);
    try {
      await updateOrderFulfillmentStatus(selectedOrder.id, newStatus, updateNote);
      await loadOrders();
      setSelectedOrder(null);
      setUpdateNote('');
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         o.customer?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || o.fulfillmentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-600 border-amber-200';
      case 'PACKING': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'SHIPPED': return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'DELIVERED': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
      case 'CANCELLED': return 'bg-rose-100 text-rose-600 border-rose-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-3.5 h-3.5" />;
      case 'PACKING': return <Package className="w-3.5 h-3.5" />;
      case 'SHIPPED': return <Truck className="w-3.5 h-3.5" />;
      case 'DELIVERED': return <CheckCircle2 className="w-3.5 h-3.5" />;
      default: return <AlertCircle className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Fulfillment Center</h2>
          <p className="text-sm text-slate-500 font-medium">Manage and dispatch online customer orders.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search Orders..."
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PACKING">Packing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center bg-white rounded-[2rem] border border-slate-100">
          <Loader2 className="w-8 h-8 text-slate-900 animate-spin mb-4" />
          <p className="text-slate-400 font-medium italic">Fetching online orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center bg-white rounded-[2rem] border border-slate-100">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
            <Package className="w-8 h-8" />
          </div>
          <p className="text-slate-500 font-bold">No online orders found.</p>
          <p className="text-slate-400 text-sm">When customers shop online, they will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map(order => (
            <motion.div 
              layoutId={order.id}
              key={order.id}
              className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all group overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black text-slate-900 uppercase font-mono">{order.id}</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border flex items-center gap-1.5",
                        getStatusColor(order.fulfillmentStatus)
                      )}>
                        {getStatusIcon(order.fulfillmentStatus)}
                        {order.fulfillmentStatus}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      {new Date(order.date).toLocaleString()}
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedOrder(order)}
                    className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-colors"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold text-xs uppercase">
                      {order.customer?.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{order.customer?.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {order.customer?.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl">
                    <MapPin className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      {order.deliveryAddress?.street}, {order.deliveryAddress?.city}, {order.deliveryAddress?.pincode}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  {order.items.slice(0, 2).map((item, i) => (
                    <div key={i} className="flex justify-between text-[11px] font-medium text-slate-500">
                      <span>{item.productName} x {item.quantity}</span>
                      <span className="text-slate-900">₹{item.totalPrice}</span>
                    </div>
                  ))}
                  {order.items.length > 2 && (
                    <p className="text-[10px] text-slate-400 italic">+{order.items.length - 2} more items</p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Amount</p>
                    <p className="text-lg font-black text-slate-900">₹{order.totalAmount}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedOrder(order)}
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
                  >
                    Manage Dispatch
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Dispatch Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                   <h3 className="text-2xl font-bold text-slate-900">Manage Dispatch</h3>
                   <p className="text-sm text-slate-500">Updating status for order <span className="font-mono font-black">{selectedOrder.id}</span></p>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 transition-all"
                >
                  <AlertCircle className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Customer & Address</h4>
                      <div className="p-4 bg-slate-50 rounded-2xl space-y-3">
                        <div className="flex items-center gap-2">
                           <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[10px] font-bold">JD</div>
                           <p className="text-sm font-bold">{selectedOrder.customer?.name}</p>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {selectedOrder.deliveryAddress?.street}<br/>
                          {selectedOrder.deliveryAddress?.city}, {selectedOrder.deliveryAddress?.pincode}
                        </p>
                        <p className="text-xs font-bold text-slate-900 border-t border-slate-200 pt-2 flex items-center gap-2">
                          <Phone className="w-3 h-3" /> {selectedOrder.customer?.phone}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Tracking History</h4>
                      <div className="space-y-4">
                        {selectedOrder.fulfillmentLogs?.map((log, i) => (
                          <div key={i} className="flex gap-3">
                            <div className="w-1 h-full bg-slate-100 rounded-full min-h-[40px] relative">
                               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-slate-300 rounded-full border-2 border-white" />
                            </div>
                            <div>
                               <p className="text-[10px] font-bold text-slate-900">{log.status}</p>
                               <p className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</p>
                               {log.note && <p className="text-[10px] italic text-slate-500 mt-1">"{log.note}"</p>}
                            </div>
                          </div>
                        ))}
                        <div className="flex gap-3">
                           <div className="w-1 h-full bg-emerald-100 rounded-full min-h-[40px] relative">
                               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                           </div>
                           <p className="text-[10px] font-bold text-emerald-600 italic">Current Status: {selectedOrder.fulfillmentStatus}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Update Status</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { status: 'PACKING', label: 'Preparing / Packing', icon: Package, color: 'blue' },
                        { status: 'SHIPPED', label: 'Handover to Courier', icon: Truck, color: 'purple' },
                        { status: 'DELIVERED', label: 'Mark as Delivered', icon: CheckCircle2, color: 'emerald' },
                        { status: 'CANCELLED', label: 'Cancel Order', icon: AlertCircle, color: 'rose' }
                      ].map((action) => (
                        <button 
                          key={action.status}
                          onClick={() => handleStatusUpdate(action.status as any)}
                          disabled={updating || selectedOrder.fulfillmentStatus === action.status}
                          className={cn(
                            "flex items-center gap-3 p-4 rounded-2xl border transition-all text-left group",
                            selectedOrder.fulfillmentStatus === action.status 
                              ? "bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed" 
                              : `border-slate-100 hover:border-${action.color}-200 hover:bg-${action.color}-50`
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                            `bg-${action.color}-100 text-${action.color}-600`
                          )}>
                            <action.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{action.label}</p>
                            <p className="text-[10px] text-slate-400 font-medium">Trigger notification to customer</p>
                          </div>
                          <ChevronRight className="w-4 h-4 ml-auto text-slate-300 opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0" />
                        </button>
                      ))}
                    </div>

                    <div className="pt-6 border-t border-slate-50">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Action Note (Optional)</label>
                      <textarea 
                        placeholder="Add a reason or tracking details..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:outline-none min-h-[100px]"
                        value={updateNote}
                        onChange={e => setUpdateNote(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 p-8 border-t border-slate-100 bg-slate-50/50 -mx-8 -mb-8">
                  <button className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl text-slate-600 font-bold flex items-center justify-center gap-3 hover:bg-slate-50">
                    <FileText className="w-5 h-5" />
                    Print Packing Slip
                  </button>
                  <button 
                    onClick={() => setSelectedOrder(null)}
                    className="flex-1 py-4 bg-slate-100 text-slate-900 rounded-2xl font-bold"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FulfillmentDispatch;
