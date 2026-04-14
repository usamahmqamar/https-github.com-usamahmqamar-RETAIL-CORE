import React, { useEffect, useState } from 'react';
import { 
  AlertTriangle, 
  Package, 
  TrendingUp, 
  AlertCircle, 
  Clock, 
  Search,
  ArrowRight,
  Plus,
  History,
  X,
  Barcode,
  Calendar,
  IndianRupee,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { fetchInventoryInsightsData, addStockEntry, recordStockAdjustment, hasPermission } from '../services/api';
import { InventoryInsightsData, InventoryItem, StockEntry, User as UserType } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface InventoryInsightsProps {
  onDataUpdate?: () => void;
  currentUser: UserType | null;
  lastScannedCode: string | null;
}

export const InventoryInsights: React.FC<InventoryInsightsProps> = ({ onDataUpdate, currentUser, lastScannedCode }) => {
  const [data, setData] = useState<InventoryInsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isStockEntryModalOpen, setIsStockEntryModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    productId: '',
    productName: '',
    barcode: '',
    purchasePrice: 0,
    sellingPrice: 0,
    gstPercent: 18,
    quantityAdded: 0,
    expiryDate: ''
  });

  const [adjustmentData, setAdjustmentData] = useState({
    productId: '',
    quantity: 0,
    type: 'LOSS_DAMAGED' as 'RETURN' | 'LOSS_DAMAGED' | 'LOSS_EXPIRED'
  });

  const loadData = async () => {
    setLoading(true);
    const result = await fetchInventoryInsightsData();
    setData(result);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (lastScannedCode) {
      setSearchTerm(lastScannedCode);
    }
  }, [lastScannedCode]);

  const handleStockEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addStockEntry({
        productId: formData.productId || 'new',
        productName: formData.productName,
        barcode: formData.barcode,
        purchasePrice: formData.purchasePrice,
        sellingPrice: formData.sellingPrice,
        gstPercent: formData.gstPercent,
        quantityAdded: formData.quantityAdded,
        expiryDate: formData.expiryDate || undefined,
        branchId: '' // Will be defaulted by API
      });
      setIsStockEntryModalOpen(false);
      setFormData({
        productId: '',
        productName: '',
        barcode: '',
        purchasePrice: 0,
        sellingPrice: 0,
        gstPercent: 18,
        quantityAdded: 0,
        expiryDate: ''
      });
      await loadData(); // Refresh local data
      if (onDataUpdate) onDataUpdate(); // Refresh main dashboard data
    } catch (error) {
      console.error("Failed to add stock entry:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustmentData.productId || adjustmentData.quantity <= 0) return;
    
    setIsSubmitting(true);
    try {
      await recordStockAdjustment(
        adjustmentData.productId,
        adjustmentData.quantity,
        adjustmentData.type
      );
      setIsAdjustmentModalOpen(false);
      setAdjustmentData({
        productId: '',
        quantity: 0,
        type: 'LOSS_DAMAGED'
      });
      await loadData();
      if (onDataUpdate) onDataUpdate();
    } catch (error) {
      console.error("Failed to record stock adjustment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const filteredInventory = data.allInventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);

  return (
    <div className="space-y-8" id="inventory-insights-module">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 flex items-center gap-4"
        >
          <div className="p-4 bg-blue-50 rounded-xl">
            <Package className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Stock Value</p>
            <h2 className="text-3xl font-black text-[var(--ink)] tracking-tighter">{formatCurrency(data.totalStockValue)}</h2>
            <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wider">Based on purchase price</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 flex items-center gap-4"
        >
          <div className="p-4 bg-emerald-50 rounded-xl">
            <TrendingUp className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Potential Revenue</p>
            <h2 className="text-3xl font-black text-[var(--ink)] tracking-tighter">{formatCurrency(data.potentialRevenue)}</h2>
            <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wider">Based on selling price</p>
          </div>
        </motion.div>
      </div>

      {/* Critical Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Out of Stock */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-rose-50 border border-rose-100 p-6 rounded-2xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <h3 className="font-bold text-rose-900">Out of Stock</h3>
            <span className="ml-auto bg-rose-200 text-rose-900 text-xs font-bold px-2 py-1 rounded-full">
              {data.outOfStockItems.length} Items
            </span>
          </div>
          <div className="space-y-3">
            {data.outOfStockItems.map(item => (
              <div key={item.id} className="flex justify-between items-center bg-white/50 p-3 rounded-xl border border-rose-200">
                <span className="text-sm font-medium text-rose-900">{item.name}</span>
                <button className="text-rose-600 hover:text-rose-700">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Low Stock */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-amber-50 border border-amber-100 p-6 rounded-2xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-amber-900">Low Stock Alert</h3>
            <span className="ml-auto bg-amber-200 text-amber-900 text-xs font-bold px-2 py-1 rounded-full">
              {data.lowStockItems.length} Items
            </span>
          </div>
          <div className="space-y-3">
            {data.lowStockItems.map(item => (
              <div key={item.id} className="flex justify-between items-center bg-white/50 p-3 rounded-xl border border-amber-200">
                <div>
                  <p className="text-sm font-medium text-amber-900">{item.name}</p>
                  <p className="text-xs text-amber-700">Qty: {item.quantity} / Min: {item.threshold}</p>
                </div>
                <button className="text-amber-600 hover:text-amber-700">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Expiring Soon */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-indigo-900">Expiring Soon</h3>
            <span className="ml-auto bg-indigo-200 text-indigo-900 text-xs font-bold px-2 py-1 rounded-full">
              {data.expiringSoonItems.length} Items
            </span>
          </div>
          <div className="space-y-3">
            {data.expiringSoonItems.map(item => (
              <div key={item.id} className="flex justify-between items-center bg-white/50 p-3 rounded-xl border border-indigo-200">
                <div>
                  <p className="text-sm font-medium text-indigo-900">{item.name}</p>
                  <p className="text-xs text-indigo-700">Expires: {item.expiryDate}</p>
                </div>
                <button className="text-indigo-600 hover:text-indigo-700">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Inventory Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-[var(--line)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[var(--ink)] uppercase tracking-widest">Inventory List</h3>
            {hasPermission(currentUser, 'inventory', 'create') && (
              <button 
                onClick={() => setIsStockEntryModalOpen(true)}
                className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
              >
                <Plus className="w-4 h-4" />
                Stock Entry
              </button>
            )}
            {hasPermission(currentUser, 'inventory', 'edit') && (
              <button 
                onClick={() => setIsAdjustmentModalOpen(true)}
                className="btn-secondary flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
              >
                <AlertTriangle className="w-4 h-4" />
                Adjust Stock
              </button>
            )}
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name or SKU..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[var(--ink)]/5 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4">Purchase Price</th>
                <th className="px-6 py-4">Selling Price</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {filteredInventory.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">{item.sku}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{item.quantity}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(item.purchasePrice)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(item.sellingPrice)}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      item.status === 'in-stock' && "bg-emerald-100 text-emerald-700",
                      item.status === 'low-stock' && "bg-amber-100 text-amber-700",
                      item.status === 'out-of-stock' && "bg-rose-100 text-rose-700",
                      item.status === 'expiring-soon' && "bg-indigo-100 text-indigo-700"
                    )}>
                      {item.status.replace('-', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Stock Entry Logs */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-[var(--line)] flex items-center gap-2">
          <History className="w-5 h-5 text-gray-400" />
          <h3 className="text-sm font-bold text-[var(--ink)] uppercase tracking-widest">Recent Stock Entry Logs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[var(--ink)]/5 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Barcode</th>
                <th className="px-6 py-4 text-right">Qty Added</th>
                <th className="px-6 py-4 text-right">Cost Price</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {data.stockLogs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(log.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{log.productName}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">{log.barcode}</td>
                  <td className="px-6 py-4 text-sm text-emerald-600 font-bold text-right">+{log.quantityAdded}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">{formatCurrency(log.purchasePrice)}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      log.actionType === 'STOCK_IN' && "bg-blue-100 text-blue-700",
                      log.actionType === 'SALE' && "bg-gray-100 text-gray-700",
                      log.actionType === 'RETURN' && "bg-emerald-100 text-emerald-700",
                      (log.actionType === 'LOSS_DAMAGED' || log.actionType === 'LOSS_EXPIRED') && "bg-rose-100 text-rose-700"
                    )}>
                      {log.actionType.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Entry Modal */}
      <AnimatePresence>
        {isStockEntryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Layers className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Inventory Stock Entry</h3>
                </div>
                <button 
                  onClick={() => setIsStockEntryModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleStockEntrySubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Select Product</label>
                    <select 
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={formData.productId}
                      onChange={(e) => {
                        const selected = data.allInventory.find(i => i.id === e.target.value);
                        if (selected) {
                          setFormData({
                            ...formData,
                            productId: selected.id,
                            productName: selected.name,
                            barcode: selected.sku,
                            purchasePrice: selected.purchasePrice,
                            sellingPrice: selected.sellingPrice
                          });
                        } else {
                          setFormData({ ...formData, productId: '', productName: '', barcode: '', purchasePrice: 0, sellingPrice: 0 });
                        }
                      }}
                    >
                      <option value="">-- Create New Product --</option>
                      {data.allInventory.map(item => (
                        <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Product Name</label>
                    <input 
                      type="text"
                      required
                      placeholder="Enter product name"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={formData.productName}
                      onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                      <Barcode className="w-3 h-3" /> Barcode / SKU
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="Scan or enter barcode"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                      <Plus className="w-3 h-3" /> Quantity to Add
                    </label>
                    <input 
                      type="number"
                      required
                      min="1"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={formData.quantityAdded}
                      onChange={(e) => setFormData({ ...formData, quantityAdded: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                      <IndianRupee className="w-3 h-3" /> Purchase Price (Cost)
                    </label>
                    <input 
                      type="number"
                      required
                      step="0.01"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={formData.purchasePrice}
                      onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                      <TrendingUp className="w-3 h-3" /> Selling Price
                    </label>
                    <input 
                      type="number"
                      required
                      step="0.01"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={formData.sellingPrice}
                      onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">GST %</label>
                    <select 
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={formData.gstPercent}
                      onChange={(e) => setFormData({ ...formData, gstPercent: parseInt(e.target.value) })}
                    >
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                      <option value="28">28%</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> Expiry Date (Optional)
                    </label>
                    <input 
                      type="date"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-400">
                    Total Entry Value: <span className="font-bold text-gray-900">{formatCurrency(formData.purchasePrice * formData.quantityAdded)}</span>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setIsStockEntryModalOpen(false)}
                      className="px-6 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-md shadow-blue-100 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Processing...' : 'Confirm Stock Entry'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Stock Adjustment Modal */}
      <AnimatePresence>
        {isAdjustmentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-amber-50">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-bold text-amber-900">Stock Adjustment</h3>
                </div>
                <button 
                  onClick={() => setIsAdjustmentModalOpen(false)}
                  className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-amber-400" />
                </button>
              </div>

              <form onSubmit={handleAdjustmentSubmit} className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Select Product</label>
                    <select 
                      required
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      value={adjustmentData.productId}
                      onChange={(e) => setAdjustmentData({ ...adjustmentData, productId: e.target.value })}
                    >
                      <option value="">-- Select Product --</option>
                      {data.allInventory.map(item => (
                        <option key={item.id} value={item.id}>{item.name} (Current: {item.quantity})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Adjustment Type</label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: 'LOSS_DAMAGED', label: 'Damaged / Broken', color: 'text-rose-600' },
                        { id: 'LOSS_EXPIRED', label: 'Expired Stock', color: 'text-rose-600' },
                        { id: 'RETURN', label: 'Customer Return', color: 'text-emerald-600' }
                      ].map(type => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setAdjustmentData({ ...adjustmentData, type: type.id as any })}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-xl border transition-all text-sm font-medium",
                            adjustmentData.type === type.id 
                              ? "bg-amber-50 border-amber-200 ring-2 ring-amber-500/20" 
                              : "bg-white border-gray-100 hover:border-amber-100"
                          )}
                        >
                          <span className={adjustmentData.type === type.id ? type.color : "text-gray-600"}>
                            {type.label}
                          </span>
                          {adjustmentData.type === type.id && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Quantity</label>
                    <input 
                      type="number"
                      required
                      min="1"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      value={adjustmentData.quantity}
                      onChange={(e) => setAdjustmentData({ ...adjustmentData, quantity: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button 
                    type="button"
                    onClick={() => setIsAdjustmentModalOpen(false)}
                    className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting || !adjustmentData.productId}
                    className="flex-2 py-3 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700 transition-colors shadow-md shadow-amber-100 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Processing...' : 'Confirm Adjustment'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
