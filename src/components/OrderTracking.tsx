import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Package, 
  Truck, 
  CheckCircle2, 
  MapPin, 
  Clock, 
  ArrowLeft,
  ShoppingBag,
  Phone,
  HelpCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Order } from '../types';
import { fetchOrderById } from '../services/api';

interface OrderTrackingProps {
  initialOrderId?: string;
  onBack?: () => void;
}

const OrderTracking: React.FC<OrderTrackingProps> = ({ initialOrderId = '', onBack }) => {
  const [orderId, setOrderId] = useState(initialOrderId);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialOrderId) {
      handleTrack(new Event('submit') as any);
    }
  }, [initialOrderId]);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await fetchOrderById(orderId.trim().toUpperCase());
      if (data) {
        setOrder(data);
      } else {
        setError('Order not found. Please check your ID and try again.');
        setOrder(null);
      }
    } catch (err) {
      setError('Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { key: 'PENDING', label: 'Order Received', icon: ShoppingBag, color: 'emerald' },
    { key: 'PACKING', label: 'Preparing Items', icon: Package, color: 'blue' },
    { key: 'SHIPPED', label: 'In Transit', icon: Truck, color: 'orange' },
    { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle2, color: 'emerald' }
  ];

  const currentStepIndex = steps.findIndex(s => s.key === order?.fulfillmentStatus) || 0;

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-slate-900 selection:bg-emerald-100">
      {/* Header */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-orange-100/50 px-4 md:px-8 py-4 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-bold text-xs uppercase tracking-widest transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-emerald-600 rounded flex items-center justify-center text-white">
            <Package className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm">Order Tracking</span>
        </div>
        <div className="w-20" /> {/* Spacer */}
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">Track your order</h1>
          <p className="text-slate-500 max-w-sm mx-auto">Enter your Order ID (found in your confirmation message) to follow its journey.</p>
        </div>

        {/* Tracking Search */}
        <div className="glass-card p-2 rounded-[2rem] bg-white border border-slate-100 shadow-xl shadow-slate-100 mb-12">
          <form onSubmit={handleTrack} className="flex gap-2">
            <div className="relative flex-1 group">
              <Package className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="text"
                placeholder="Ex: ORD-ABC123XYZ"
                className="w-full bg-slate-50 border-none rounded-[1.5rem] py-5 pl-14 pr-6 font-mono font-bold text-slate-900 focus:ring-0 focus:outline-none placeholder:text-slate-200"
                value={orderId}
                onChange={e => setOrderId(e.target.value.toUpperCase())}
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="px-8 bg-slate-900 text-white rounded-[1.5rem] font-bold text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              Track
            </button>
          </form>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-3 text-sm font-medium"
          >
            <AlertCircle className="w-5 h-5" />
            {error}
          </motion.div>
        )}

        {/* Results Container */}
        {order && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Status Timeline */}
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden">
               <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12 relative z-10">
                 <div>
                   <h2 className="text-2xl font-bold text-slate-900 mb-1">Status: {steps[currentStepIndex].label}</h2>
                   <p className="text-sm text-slate-400 font-medium">Tracking #: {order.trackingNumber}</p>
                 </div>
                 <div className="flex items-center gap-3 p-3 bg-emerald-50 text-emerald-700 rounded-2xl">
                    <Clock className="w-5 h-5" />
                    <div className="text-left leading-tight">
                      <p className="text-[10px] uppercase font-bold tracking-widest opacity-70">Estimated Delivery</p>
                      <p className="text-sm font-bold">{new Date(order.estimatedDelivery!).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                    </div>
                 </div>
               </div>

               {/* Modern Timeline */}
               <div className="relative mb-8">
                  {/* Line Background */}
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 rounded-full hidden md:block" />
                  <div 
                    className="absolute top-1/2 left-0 h-1 bg-emerald-500 -translate-y-1/2 rounded-full transition-all duration-1000 hidden md:block"
                    style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                  />

                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative">
                    {steps.map((step, idx) => {
                      const isCompleted = idx <= currentStepIndex;
                      const isActive = idx === currentStepIndex;
                      const Icon = step.icon;

                      return (
                        <div key={idx} className="flex md:flex-col items-center gap-4 md:gap-3 flex-1 relative">
                          <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 relative z-10",
                            isActive ? "bg-emerald-600 text-white ring-8 ring-emerald-50" :
                            isCompleted ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-300"
                          )}>
                             <Icon className="w-5 h-5" />
                          </div>
                          <div className="text-left md:text-center">
                            <h4 className={cn(
                              "text-sm font-bold transition-colors",
                              isCompleted ? "text-slate-900" : "text-slate-300"
                            )}>{step.label}</h4>
                            {isActive && <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-0.5">In Progress</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
               </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Shipping Details */}
              <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <MapPin className="w-5 h-5 text-emerald-500" />
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Shipping Address</h4>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-900 text-lg">{order.deliveryAddress?.street}</p>
                  <p className="text-slate-500">{order.deliveryAddress?.city}, {order.deliveryAddress?.pincode}</p>
                  <p className="text-slate-500">{order.deliveryAddress?.state}</p>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <ShoppingBag className="w-5 h-5 text-emerald-500" />
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Order Summary</h4>
                </div>
                <div className="space-y-4 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="font-bold text-slate-900 truncate">{item.productName}</p>
                        <p className="text-slate-400 text-xs">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-bold text-slate-900">{formatCurrency(item.totalPrice)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Paid</span>
                  <span className="text-xl font-black text-slate-900">{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Support Action */}
            <div className="flex flex-col md:flex-row gap-4">
              <button className="flex-1 p-5 rounded-3xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold flex items-center justify-center gap-3 hover:bg-emerald-100 transition-all">
                <Phone className="w-5 h-5" />
                Contact Store Support
              </button>
              <button className="flex-1 p-5 rounded-3xl bg-slate-100 text-slate-600 font-bold flex items-center justify-center gap-3 hover:bg-slate-200 transition-all">
                <HelpCircle className="w-5 h-5" />
                Return Policy
              </button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default OrderTracking;
