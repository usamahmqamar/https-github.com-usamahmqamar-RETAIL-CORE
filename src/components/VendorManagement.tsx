import React, { useEffect, useState } from 'react';
import { 
  Users, 
  FileText, 
  IndianRupee, 
  Plus, 
  Search, 
  Filter, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  X,
  PlusCircle,
  Calendar,
  CreditCard,
  History,
  TrendingUp,
  Building2,
  ChevronRight,
  ChevronDown,
  Trash2,
  Loader2
} from 'lucide-react';
import { fetchVendorManagementData, createVendorBill, recordVendorPayment, createSupplier, hasPermission } from '../services/api';
import { VendorManagementData, Supplier, VendorBill, VendorPayment, User as UserType } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface VendorManagementProps {
  onDataUpdate?: () => void;
  currentUser: UserType | null;
}

export const VendorManagement: React.FC<VendorManagementProps> = ({ onDataUpdate, currentUser }) => {
  const [data, setData] = useState<VendorManagementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState<'overview' | 'vendors' | 'bills'>('overview');
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  
  // Modals
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState(false);
  const [isAddBillModalOpen, setIsAddBillModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBill, setSelectedBill] = useState<VendorBill | null>(null);

  // Form states
  const [vendorForm, setVendorForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    gstNumber: '',
    paymentTerms: ''
  });

  const [billForm, setBillForm] = useState({
    vendorId: '',
    billNumber: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
    totalAmount: 0
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    paymentMethod: 'UPI' as VendorPayment['paymentMethod'],
    referenceNumber: '',
    note: ''
  });

  const loadData = async () => {
    setLoading(true);
    const result = await fetchVendorManagementData();
    setData(result);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createSupplier({
        ...vendorForm,
        totalOwed: 0,
        totalPaid: 0
      });
      setIsAddVendorModalOpen(false);
      setVendorForm({ name: '', contactPerson: '', phone: '', email: '', address: '', gstNumber: '', paymentTerms: '' });
      await loadData();
    } catch (error) {
      console.error("Failed to add vendor:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const vendorName = data?.vendors.find(v => v.id === billForm.vendorId)?.name || 'Unknown';
      await createVendorBill({
        ...billForm,
        vendorName,
        branchId: currentUser?.branchId || '',
        paidAmount: 0,
        balance: billForm.totalAmount,
        status: 'UNPAID'
      });
      setIsAddBillModalOpen(false);
      setBillForm({ vendorId: '', billNumber: '', date: new Date().toISOString().split('T')[0], dueDate: '', items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }], totalAmount: 0 });
      await loadData();
    } catch (error) {
      console.error("Failed to add bill:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) return;
    setIsSubmitting(true);
    try {
      await recordVendorPayment({
        ...paymentForm,
        billId: selectedBill.id,
        vendorId: selectedBill.vendorId
      });
      setIsPaymentModalOpen(false);
      setSelectedBill(null);
      setPaymentForm({ amount: 0, paymentMethod: 'UPI', referenceNumber: '', note: '' });
      await loadData();
    } catch (error) {
      console.error("Failed to record payment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!data) return null;

  const filteredBills = data.bills.filter(b => 
    b.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.billNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredVendors = data.vendors.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard 
          title="Total Outstanding" 
          value={data.totalOwed} 
          previousValue={data.totalOwed * 0.9} 
          unit="currency" 
          trend="up"
          icon={<AlertCircle className="w-5 h-5" />}
          color="rose"
        />
        <KPICard 
          title="Total Overdue" 
          value={data.totalOverdue} 
          previousValue={data.totalOverdue * 1.1} 
          unit="currency" 
          trend="down"
          icon={<Clock className="w-5 h-5" />}
          color="amber"
        />
        <KPICard 
          title="Total Vendors" 
          value={data.vendors.length} 
          previousValue={data.vendors.length} 
          unit="number" 
          trend="neutral"
          icon={<Users className="w-5 h-5" />}
          color="blue"
        />
        <KPICard 
          title="Pending Bills" 
          value={data.bills.filter(b => b.status !== 'PAID').length} 
          previousValue={data.bills.filter(b => b.status !== 'PAID').length + 2} 
          unit="number" 
          trend="down"
          icon={<FileText className="w-5 h-5" />}
          color="indigo"
        />
      </div>

      {/* Main Container */}
      <div className="glass-card overflow-hidden">
        {/* Navigation Tabs */}
        <div className="p-4 border-b border-[var(--line)] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-1 p-1 bg-slate-200/50 rounded-xl w-fit">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'vendors', label: 'Vendors', icon: Users },
              { id: 'bills', label: 'Bills & Invoices', icon: FileText }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
                  activeView === tab.id 
                    ? "bg-white text-slate-900 shadow-sm" 
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {hasPermission(currentUser, 'suppliers', 'create') && (
              <button 
                onClick={() => setIsAddBillModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
              >
                <PlusCircle className="w-4 h-4" />
                Add Bill
              </button>
            )}
            {hasPermission(currentUser, 'suppliers', 'create') && (
              <button 
                onClick={() => setIsAddVendorModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-900 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                <Plus className="w-4 h-4 text-emerald-500" />
                New Vendor
              </button>
            )}
          </div>
        </div>

        {/* Search Bar - only shown in list views */}
        {activeView !== 'overview' && (
          <div className="p-4 border-b border-[var(--line)] bg-white">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder={`Search ${activeView}...`}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* View Content */}
        <div className="p-0">
          {activeView === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              {/* Overdue Bills Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    Priority Overdue Bills
                  </h4>
                  <button onClick={() => setActiveView('bills')} className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline">View All</button>
                </div>
                <div className="space-y-3">
                  {data.bills.filter(b => b.status !== 'PAID' && new Date(b.dueDate) < new Date()).slice(0, 5).map(bill => (
                    <div key={bill.id} className="p-4 border border-rose-100 bg-rose-50/30 rounded-2xl flex items-center justify-between group hover:border-rose-200 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-rose-100 flex items-center justify-center shadow-sm">
                          <FileText className="w-5 h-5 text-rose-500" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{bill.vendorName}</p>
                          <p className="text-[10px] text-rose-600 font-bold uppercase tracking-widest">
                            Overdue since {new Date(bill.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">{formatCurrency(bill.balance)}</p>
                        <button 
                          onClick={() => { setSelectedBill(bill); setIsPaymentModalOpen(true); }}
                          className="text-[10px] font-bold text-white bg-rose-500 px-3 py-1 rounded-lg uppercase tracking-widest shadow-lg shadow-rose-100 hover:bg-rose-600 transition-all"
                        >
                          Pay Now
                        </button>
                      </div>
                    </div>
                  ))}
                  {data.bills.filter(b => b.status !== 'PAID' && new Date(b.dueDate) < new Date()).length === 0 && (
                    <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-medium text-gray-400">All bills are current! No overdue payments.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Vendor Balances Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    Top Vendor Balances
                  </h4>
                  <button onClick={() => setActiveView('vendors')} className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline">View All</button>
                </div>
                <div className="space-y-3">
                  {data.vendors.filter(v => v.totalOwed > 0).sort((a, b) => b.totalOwed - a.totalOwed).slice(0, 5).map(vendor => (
                    <div key={vendor.id} className="p-4 border border-slate-100 bg-white rounded-2xl flex items-center justify-between hover:border-slate-300 transition-all shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{vendor.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            Total Paid: {formatCurrency(vendor.totalPaid)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">{formatCurrency(vendor.totalOwed)}</p>
                        <div className="h-1.5 w-24 bg-gray-100 rounded-full mt-1 overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ width: `${Math.min(100, (vendor.totalOwed / (vendor.totalOwed + vendor.totalPaid)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeView === 'vendors' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Vendor Details</th>
                    <th className="px-6 py-4">Contact Person</th>
                    <th className="px-6 py-4">Payment Terms</th>
                    <th className="px-6 py-4 text-right">Total Paid</th>
                    <th className="px-6 py-4 text-right">Outstanding</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVendors.map(vendor => (
                    <tr key={vendor.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{vendor.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono tracking-tighter">{vendor.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-slate-700">{vendor.contactPerson}</p>
                          <p className="text-[10px] text-slate-400">{vendor.phone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                          {vendor.paymentTerms || 'Not Set'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900 text-right">
                        {formatCurrency(vendor.totalPaid)}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-rose-600 text-right">
                        {formatCurrency(vendor.totalOwed)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                          vendor.totalOwed > 0 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                        )}>
                          {vendor.totalOwed > 0 ? 'Pending Duo' : 'Clear'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 hover:bg-white rounded-lg transition-colors text-slate-300 hover:text-slate-900">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeView === 'bills' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Bill Details</th>
                    <th className="px-6 py-4">Vendor</th>
                    <th className="px-6 py-4">Dates</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4 text-right">Balance</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBills.map(bill => (
                    <tr key={bill.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{bill.billNumber}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">{bill.items.length} Items</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 font-medium">{bill.vendorName}</td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-[10px] text-slate-500">
                            <Calendar className="w-3 h-3" />
                            <span>Bill: {new Date(bill.date).toLocaleDateString()}</span>
                          </div>
                          <div className={cn(
                            "flex items-center gap-1 text-[10px] font-bold",
                            new Date(bill.dueDate) < new Date() && bill.status !== 'PAID' ? "text-rose-600" : "text-slate-500"
                          )}>
                            <Clock className="w-3 h-3" />
                            <span>Due: {new Date(bill.dueDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900 text-right">
                        {formatCurrency(bill.totalAmount)}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-rose-600 text-right">
                        {formatCurrency(bill.balance)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                          bill.status === 'PAID' && "bg-emerald-100 text-emerald-700",
                          bill.status === 'PARTIALLY_PAID' && "bg-amber-100 text-amber-700",
                          bill.status === 'UNPAID' && "bg-rose-100 text-rose-700"
                        )}>
                          {bill.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {bill.status !== 'PAID' && hasPermission(currentUser, 'suppliers', 'edit') && (
                            <button 
                              onClick={() => { setSelectedBill(bill); setIsPaymentModalOpen(true); }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-100 transition-all border border-emerald-100"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              Pay
                            </button>
                          )}
                          <button 
                            onClick={() => setSelectedBill(bill)}
                            className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-slate-900 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Vendor Modal */}
      <AnimatePresence>
        {isAddVendorModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-emerald-50">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-600 rounded-lg">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-emerald-900">Add New Vendor</h3>
                </div>
                <button onClick={() => setIsAddVendorModalOpen(false)} className="p-2 hover:bg-emerald-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-emerald-400" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[70vh]">
                <form onSubmit={handleAddVendor} className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Vendor / Business Name</label>
                      <input 
                        type="text" required 
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                        value={vendorForm.name}
                        onChange={e => setVendorForm({ ...vendorForm, name: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Contact Person</label>
                        <input 
                          type="text" required
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                          value={vendorForm.contactPerson}
                          onChange={e => setVendorForm({ ...vendorForm, contactPerson: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Phone</label>
                        <input 
                          type="text" required
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                          value={vendorForm.phone}
                          onChange={e => setVendorForm({ ...vendorForm, phone: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Address</label>
                      <textarea 
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                        rows={2}
                        value={vendorForm.address}
                        onChange={e => setVendorForm({ ...vendorForm, address: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setIsAddVendorModalOpen(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600">Cancel</button>
                    <button type="submit" disabled={isSubmitting} className="flex-[2] py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 disabled:opacity-50">
                      {isSubmitting ? 'Saving...' : 'Register Vendor'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Bill Modal */}
      <AnimatePresence>
        {isAddBillModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-900">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-slate-800 rounded-lg">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Record Vendor Bill</h3>
                </div>
                <button onClick={() => setIsAddBillModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[70vh]">
                <form onSubmit={handleAddBill} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Select Vendor</label>
                    <select 
                      required
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                      value={billForm.vendorId}
                      onChange={e => setBillForm({ ...billForm, vendorId: e.target.value })}
                    >
                      <option value="">Choose Vendor...</option>
                      {data.vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Bill / Invoice #</label>
                    <input 
                      type="text" required 
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono"
                      value={billForm.billNumber}
                      onChange={e => setBillForm({ ...billForm, billNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Bill Date</label>
                    <input 
                      type="date" required 
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                      value={billForm.date}
                      onChange={e => setBillForm({ ...billForm, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Due Date</label>
                    <input 
                      type="date" required 
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                      value={billForm.dueDate}
                      onChange={e => setBillForm({ ...billForm, dueDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Bill Items</label>
                  <div className="space-y-2">
                    {billForm.items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-6">
                          <input 
                            placeholder="Description"
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                            value={item.description}
                            onChange={e => {
                              const newItems = [...billForm.items];
                              newItems[idx].description = e.target.value;
                              setBillForm({ ...billForm, items: newItems });
                            }}
                          />
                        </div>
                        <div className="col-span-2">
                          <input 
                            type="number" placeholder="Qty"
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                            value={item.quantity}
                            onChange={e => {
                              const newItems = [...billForm.items];
                              newItems[idx].quantity = parseInt(e.target.value) || 0;
                              newItems[idx].total = newItems[idx].quantity * newItems[idx].unitPrice;
                              const totalAmount = newItems.reduce((sum, i) => sum + i.total, 0);
                              setBillForm({ ...billForm, items: newItems, totalAmount });
                            }}
                          />
                        </div>
                        <div className="col-span-3">
                          <input 
                            type="number" placeholder="Price"
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                            value={item.unitPrice}
                            onChange={e => {
                              const newItems = [...billForm.items];
                              newItems[idx].unitPrice = parseFloat(e.target.value) || 0;
                              newItems[idx].total = newItems[idx].quantity * newItems[idx].unitPrice;
                              const totalAmount = newItems.reduce((sum, i) => sum + i.total, 0);
                              setBillForm({ ...billForm, items: newItems, totalAmount });
                            }}
                          />
                        </div>
                        <div className="col-span-1">
                          <button 
                            type="button"
                            onClick={() => {
                              const newItems = billForm.items.filter((_, i) => i !== idx);
                              const totalAmount = newItems.reduce((sum, i) => sum + i.total, 0);
                              setBillForm({ ...billForm, items: newItems, totalAmount });
                            }}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button 
                      type="button"
                      onClick={() => setBillForm({ ...billForm, items: [...billForm.items, { description: '', quantity: 1, unitPrice: 0, total: 0 }] })}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 uppercase tracking-widest"
                    >
                      <Plus className="w-3 h-3" /> Add Item
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Bill Amount</span>
                  <span className="text-xl font-bold text-slate-900">{formatCurrency(billForm.totalAmount)}</span>
                </div>

                <div className="flex gap-3">
                    <button type="button" onClick={() => setIsAddBillModalOpen(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600">Cancel</button>
                    <button type="submit" disabled={isSubmitting} className="flex-[2] py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 shadow-lg shadow-slate-200 disabled:opacity-50">
                      {isSubmitting ? 'Recording...' : 'Save Bill'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && selectedBill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-emerald-600">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-500 rounded-lg text-white">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Pay Vendor Bill</h3>
                </div>
                <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 hover:bg-emerald-500 rounded-lg transition-colors text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[70vh]">
                <form onSubmit={handlePaymentSubmit} className="space-y-6">
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mb-1">Paying Balance for {selectedBill.billNumber}</p>
                  <p className="text-lg font-bold text-emerald-900">{selectedBill.vendorName}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-emerald-700">Outstanding:</span>
                    <span className="text-sm font-bold text-emerald-900">{formatCurrency(selectedBill.balance)}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Payment Amount</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="number" required max={selectedBill.balance}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
                        value={paymentForm.amount}
                        onChange={e => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Method</label>
                      <select 
                        required
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                        value={paymentForm.paymentMethod}
                        onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as any })}
                      >
                        <option value="UPI">UPI</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                        <option value="CASH">Cash</option>
                        <option value="CHEQUE">Cheque</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Reference #</label>
                      <input 
                        type="text"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono"
                        value={paymentForm.referenceNumber}
                        onChange={e => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                        placeholder="UTR / Txn ID"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Internal Note</label>
                    <input 
                      type="text"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                      value={paymentForm.note}
                      onChange={e => setPaymentForm({ ...paymentForm, note: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                    <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600">Cancel</button>
                    <button type="submit" disabled={isSubmitting || paymentForm.amount <= 0} className="flex-[2] py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100">
                      {isSubmitting ? 'Processing...' : 'Confirm Payment'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bill Details Modal */}
      <AnimatePresence>
        {selectedBill && !isPaymentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-400" />
                  <h3 className="text-xl font-bold text-slate-900">Bill Details: {selectedBill.billNumber}</h3>
                </div>
                <button onClick={() => setSelectedBill(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-8 py-4 border-b border-slate-50">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Vendor</p>
                    <p className="font-bold text-slate-900">{selectedBill.vendorName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                      selectedBill.status === 'PAID' ? "bg-emerald-100 text-emerald-700" : 
                      selectedBill.status === 'PARTIALLY_PAID' ? "bg-amber-100 text-amber-700" :
                      "bg-rose-100 text-rose-700"
                    )}>
                      {selectedBill.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Line Items</p>
                  <div className="rounded-xl border border-slate-100 overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Description</th>
                          <th className="px-4 py-3 text-center">Qty</th>
                          <th className="px-4 py-3 text-right">Price</th>
                          <th className="px-4 py-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {selectedBill.items.map((item, i) => (
                          <tr key={i}>
                            <td className="px-4 py-3 text-slate-700">{item.description}</td>
                            <td className="px-4 py-3 text-center">{item.quantity}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                            <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50/50 font-bold">
                        <tr>
                          <td colSpan={3} className="px-4 py-3 text-right uppercase tracking-widest text-[10px] text-slate-400">Amount Paid</td>
                          <td className="px-4 py-3 text-right text-emerald-600">{formatCurrency(selectedBill.paidAmount)}</td>
                        </tr>
                        <tr>
                          <td colSpan={3} className="px-4 py-3 text-right uppercase tracking-widest text-[10px] text-slate-400">Balance Due</td>
                          <td className="px-4 py-3 text-right text-rose-600">{formatCurrency(selectedBill.balance)}</td>
                        </tr>
                        <tr className="border-t border-slate-200">
                          <td colSpan={3} className="px-4 py-3 text-right uppercase tracking-widest text-[10px] text-slate-900">Grand Total</td>
                          <td className="px-4 py-3 text-right text-slate-900">{formatCurrency(selectedBill.totalAmount)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                 <button onClick={() => setSelectedBill(null)} className="px-6 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all">Close</button>
                 {selectedBill.status !== 'PAID' && hasPermission(currentUser, 'suppliers', 'edit') && (
                   <button 
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-200"
                   >
                     <CreditCard className="w-4 h-4" />
                     Pay Bill
                   </button>
                 )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Re-using components or building local versions for completeness
const KPICard = ({ title, value, previousValue, unit, trend, icon, color }: any) => {
  const getColors = () => {
    switch(color) {
      case 'rose': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'amber': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'blue': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    }
  };

  return (
    <div className={cn("p-4 rounded-2xl border shadow-sm", getColors())}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{title}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold">
        {unit === 'currency' ? `₹${value.toLocaleString('en-IN')}` : value}
      </div>
    </div>
  );
};

const Eye = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
