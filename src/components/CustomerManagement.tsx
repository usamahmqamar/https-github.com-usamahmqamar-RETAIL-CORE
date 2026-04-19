import React, { useEffect, useState } from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  ShoppingBag, 
  IndianRupee, 
  Calendar, 
  CreditCard, 
  Search, 
  ArrowRight, 
  ChevronRight,
  History,
  AlertCircle,
  CheckCircle2,
  Clock,
  Banknote,
  Smartphone
} from 'lucide-react';
import { fetchCustomers, recordPayment, refundOrder, hasPermission } from '../services/api';
import { Customer, Order, PaymentRecord, User as UserType } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { 
  RotateCcw, 
  Trash2,
  X
} from 'lucide-react';

interface CustomerManagementProps {
  currentUser: UserType | null;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({ currentUser }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD'>('CASH');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isRefunding, setIsRefunding] = useState(false);
  const [orderToRefund, setOrderToRefund] = useState<string | null>(null);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await fetchCustomers();
      setCustomers(data);
      if (selectedCustomer) {
        const updated = data.find(c => c.id === selectedCustomer.id);
        if (updated) setSelectedCustomer(updated);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  const handleRecordPayment = async () => {
    if (!selectedOrderId || paymentAmount <= 0) return;
    try {
      await recordPayment(selectedOrderId, {
        amount: paymentAmount,
        method: paymentMethod,
        note: 'Manual payment record'
      });
      setIsRecordingPayment(false);
      setPaymentAmount(0);
      setSelectedOrderId(null);
      loadCustomers();
    } catch (error) {
      console.error("Failed to record payment:", error);
    }
  };

  const handleRefundOrder = async () => {
    if (!orderToRefund) return;
    setIsRefunding(true);
    try {
      await refundOrder(orderToRefund);
      setOrderToRefund(null);
      loadCustomers();
    } catch (error) {
      console.error("Failed to refund order:", error);
    } finally {
      setIsRefunding(false);
    }
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);

  const formatDate = (dateStr?: string) => 
    dateStr ? new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never';

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)] min-h-[600px]">
      {/* Left Side: Customer List */}
      <div className="w-full lg:w-[400px] bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-100 space-y-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Customers
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name or phone..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading customers...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No customers found</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredCustomers.map(customer => (
                <button
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer)}
                  className={cn(
                    "w-full p-4 text-left transition-all flex items-center gap-4 hover:bg-gray-50",
                    selectedCustomer?.id === customer.id ? "bg-blue-50/50 border-r-4 border-blue-600" : ""
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-sm",
                    customer.outstandingBalance > 0 ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                  )}>
                    {customer.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">{customer.name}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {customer.phone}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(customer.totalSpent)}</p>
                    {customer.outstandingBalance > 0 && (
                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-tighter">
                        Due: {formatCurrency(customer.outstandingBalance)}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Side: Customer Details */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        {!selectedCustomer ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4 opacity-40">
            <div className="p-6 bg-gray-50 rounded-full">
              <User className="w-16 h-16" />
            </div>
            <p className="text-lg font-bold">Select a customer to view details</p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Profile Header */}
            <div className="p-8 bg-gray-50/50 border-b border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-3xl font-black shadow-lg shadow-blue-100">
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900">{selectedCustomer.name}</h2>
                    <div className="flex flex-wrap gap-4 mt-2">
                      <span className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Phone className="w-4 h-4 text-blue-500" /> {selectedCustomer.phone}
                      </span>
                      {selectedCustomer.email && (
                        <span className="flex items-center gap-1.5 text-sm text-gray-500">
                          <Mail className="w-4 h-4 text-blue-500" /> {selectedCustomer.email}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Calendar className="w-4 h-4 text-blue-500" /> Joined {formatDate(selectedCustomer.lastPurchaseDate)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center min-w-[120px]">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Spent</p>
                    <p className="text-xl font-black text-blue-600">{formatCurrency(selectedCustomer.totalSpent)}</p>
                  </div>
                  <div className={cn(
                    "p-4 rounded-2xl shadow-sm border text-center min-w-[120px]",
                    selectedCustomer.outstandingBalance > 0 ? "bg-amber-50 border-amber-100" : "bg-emerald-50 border-emerald-100"
                  )}>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Outstanding</p>
                    <p className={cn(
                      "text-xl font-black",
                      selectedCustomer.outstandingBalance > 0 ? "text-amber-600" : "text-emerald-600"
                    )}>
                      {formatCurrency(selectedCustomer.outstandingBalance)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Tabs (Order History) */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <History className="w-5 h-5 text-blue-600" />
                    Order History
                  </h3>
                  <span className="text-xs font-bold text-gray-400 uppercase bg-gray-100 px-3 py-1 rounded-full">
                    {selectedCustomer.ordersCount} Orders Total
                  </span>
                </div>

                <div className="space-y-4">
                  {selectedCustomer.orderHistory?.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      No order history found for this customer.
                    </div>
                  ) : (
                    selectedCustomer.orderHistory?.map(order => (
                      <div key={order.id} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-all">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-900">{order.id}</span>
                              <span className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                                order.paymentStatus === 'PAID' ? "bg-emerald-100 text-emerald-700" : 
                                order.paymentStatus === 'PARTIALLY_PAID' ? "bg-amber-100 text-amber-700" : 
                                "bg-rose-100 text-rose-700"
                              )}>
                                {order.paymentStatus}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400">{new Date(order.date).toLocaleString()}</p>
                          </div>
                          
                          <div className="flex flex-wrap gap-6 text-right">
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase">Total Amount</p>
                              <p className="text-sm font-bold text-gray-900">{formatCurrency(order.totalAmount)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase">Paid</p>
                              <p className="text-sm font-bold text-emerald-600">{formatCurrency(order.amountPaid)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase">Balance</p>
                              <p className={cn(
                                "text-sm font-bold",
                                order.balanceDue > 0 ? "text-rose-600" : "text-gray-400"
                              )}>
                                {formatCurrency(order.balanceDue)}
                              </p>
                            </div>
                            {order.balanceDue > 0 && hasPermission(currentUser, 'payments', 'create') && (
                              <button 
                                onClick={() => {
                                  setSelectedOrderId(order.id);
                                  setPaymentAmount(order.balanceDue);
                                  setIsRecordingPayment(true);
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 flex items-center gap-2"
                              >
                                <IndianRupee className="w-3 h-3" /> Record Payment
                              </button>
                            )}
                            {hasPermission(currentUser, 'refunds', 'approve') && (
                              <button 
                                onClick={() => setOrderToRefund(order.id)}
                                className="px-4 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-xs font-bold hover:bg-rose-100 flex items-center gap-2"
                              >
                                <RotateCcw className="w-3 h-3" /> Refund
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Order Items Summary */}
                        <div className="mt-4 pt-4 border-t border-gray-50 flex flex-wrap gap-2">
                          {order.items.map((item, idx) => (
                            <span key={idx} className="text-[10px] bg-gray-50 text-gray-500 px-2 py-1 rounded-md border border-gray-100">
                              {item.productName} x{item.quantity}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {isRecordingPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-blue-50 shrink-0">
                <div className="flex items-center gap-2">
                  <IndianRupee className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-bold text-blue-900">Record Payment</h3>
                </div>
                <button 
                  onClick={() => setIsRecordingPayment(false)}
                  className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-blue-600" />
                </button>
              </div>

              <div className="p-8 space-y-6 overflow-y-auto flex-1">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">Amount to Record</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="number" 
                      className="w-full pl-10 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-2xl font-black focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">Payment Method</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button 
                      onClick={() => setPaymentMethod('CASH')}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                        paymentMethod === 'CASH' ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100" : "bg-white text-gray-500 border-gray-100 hover:border-blue-200"
                      )}
                    >
                      <Banknote className="w-6 h-6" />
                      <span className="text-xs font-bold">Cash</span>
                    </button>
                    <button 
                      onClick={() => setPaymentMethod('UPI')}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                        paymentMethod === 'UPI' ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100" : "bg-white text-gray-500 border-gray-100 hover:border-blue-200"
                      )}
                    >
                      <Smartphone className="w-6 h-6" />
                      <span className="text-xs font-bold">UPI</span>
                    </button>
                    <button 
                      onClick={() => setPaymentMethod('CARD')}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                        paymentMethod === 'CARD' ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100" : "bg-white text-gray-500 border-gray-100 hover:border-blue-200"
                      )}
                    >
                      <CreditCard className="w-6 h-6" />
                      <span className="text-xs font-bold">Card</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0 flex gap-3">
                <button 
                  onClick={() => setIsRecordingPayment(false)}
                  className="flex-1 py-4 bg-white border border-gray-200 text-gray-500 rounded-2xl font-bold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRecordPayment}
                  className="flex-2 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                >
                  Confirm Payment
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Refund Confirmation Modal */}
      <AnimatePresence>
        {orderToRefund && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-rose-50 shrink-0">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-6 h-6 text-rose-600" />
                  <h3 className="text-xl font-bold text-rose-900">Confirm Refund</h3>
                </div>
                <button 
                  onClick={() => setOrderToRefund(null)}
                  className="p-2 hover:bg-rose-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-rose-600" />
                </button>
              </div>

              <div className="p-8 space-y-6 overflow-y-auto flex-1">
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-bold">Important Notice</p>
                    <p>Refunding this order will:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Mark the order as unpaid/refunded</li>
                      <li>Deduct the amount from customer's total spent</li>
                      <li><span className="font-bold">Automatically return all items to stock</span></li>
                    </ul>
                  </div>
                </div>

                <p className="text-gray-600">Are you sure you want to refund order <span className="font-bold text-gray-900">{orderToRefund}</span>?</p>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0 flex gap-3">
                <button 
                  onClick={() => setOrderToRefund(null)}
                  className="flex-1 py-4 bg-white border border-gray-200 text-gray-500 rounded-2xl font-bold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRefundOrder}
                  disabled={isRefunding}
                  className="flex-2 py-4 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 disabled:opacity-50"
                >
                  {isRefunding ? 'Processing...' : 'Confirm Refund'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
