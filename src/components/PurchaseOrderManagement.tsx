import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Calendar, 
  User, 
  Package, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  X,
  FileText,
  Truck,
  ArrowRight,
  Trash2,
  Zap,
  Check,
  Loader2
} from 'lucide-react';
import { PurchaseOrder, Supplier, InventoryItem, User as UserType, SmartProcurementSuggestion } from '../types';
import { fetchPurchaseOrders, createPurchaseOrder, receivePurchaseOrder, fetchSuppliers, fetchInventory, hasPermission, generateProcurementSuggestions } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

interface PurchaseOrderManagementProps {
  currentUser: UserType;
}

export const PurchaseOrderManagement: React.FC<PurchaseOrderManagementProps> = ({ currentUser }) => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSmartPOOpen, setIsSmartPOOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SmartProcurementSuggestion[]>([]);
  
  // New PO State
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [poItems, setPoItems] = useState<{ productId: string; quantity: number; unitPrice: number }[]>([]);

  const canCreate = hasPermission(currentUser, 'procurement', 'create');
  const canApprove = hasPermission(currentUser, 'procurement', 'approve');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pos, sups, inv] = await Promise.all([
        fetchPurchaseOrders(),
        fetchSuppliers(),
        fetchInventory()
      ]);
      setPurchaseOrders(pos);
      setSuppliers(sups);
      setInventory(inv);
    } catch (error) {
      console.error('Failed to load data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || poItems.length === 0) return;

    const supplier = suppliers.find(s => s.id === selectedSupplierId);
    if (!supplier) return;

    const items = poItems.map(item => {
      const product = inventory.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        productName: product?.name || 'Unknown',
        sku: product?.sku || 'N/A',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice
      };
    });

    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

    try {
      await createPurchaseOrder({
        supplierId: selectedSupplierId,
        supplierName: supplier.name,
        items,
        totalAmount,
        branchId: currentUser.branchId
      });
      setIsModalOpen(false);
      setSelectedSupplierId('');
      setPoItems([]);
      loadData();
    } catch (error) {
      console.error('Failed to create PO', error);
    }
  };

  const handleReceivePO = async (id: string) => {
    try {
      await receivePurchaseOrder(id);
      loadData();
    } catch (error) {
      console.error('Failed to receive PO', error);
    }
  };

  const addItemToPO = () => {
    setPoItems([...poItems, { productId: '', quantity: 1, unitPrice: 0 }]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...poItems];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-fill unit price if product is selected
    if (field === 'productId') {
      const product = inventory.find(p => p.id === value);
      if (product) {
        newItems[index].unitPrice = product.purchasePrice;
      }
    }
    
    setPoItems(newItems);
  };

  const removeItem = (index: number) => {
    setPoItems(poItems.filter((_, i) => i !== index));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RECEIVED': return 'bg-green-100 text-green-700';
      case 'SENT': return 'bg-blue-100 text-blue-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredPOs = purchaseOrders.filter(po => 
    po.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSmartProcure = async () => {
    setLoading(true);
    try {
      const data = await generateProcurementSuggestions();
      setSuggestions(data);
      setIsSmartPOOpen(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createPOFromSuggestion = (suggestion: SmartProcurementSuggestion) => {
    setSelectedSupplierId(suggestion.preferredSupplierId || (suppliers.length > 0 ? suppliers[0].id : ''));
    setPoItems([{
      productId: suggestion.productId,
      quantity: suggestion.suggestedQuantity,
      unitPrice: suggestion.lastPurchasePrice
    }]);
    setIsSmartPOOpen(false);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" id="purchase-order-management">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-indigo-600" />
            Purchase Orders
          </h1>
          <p className="text-sm text-gray-500">Manage procurement and stock replenishment</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSmartProcure}
            className="flex items-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-100 px-4 py-2 rounded-lg hover:bg-emerald-100 transition-colors shadow-sm text-sm font-bold"
          >
            <Zap className="w-4 h-4" />
            Smart PO Engine
          </button>
          {canCreate && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create PO
            </button>
          )}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search POs by ID or supplier..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">PO ID</th>
              <th className="px-6 py-4">Supplier</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredPOs.map((po) => (
              <tr key={po.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-4">
                  <span className="font-mono font-medium text-indigo-600">{po.id}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{po.supplierName}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {format(new Date(po.date), 'MMM dd, yyyy')}
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">
                  ₹{po.totalAmount.toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(po.status)}`}>
                    {po.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {po.status === 'SENT' && canApprove && (
                    <button
                      onClick={() => handleReceivePO(po.id)}
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1 ml-auto"
                    >
                      Receive Stock
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  {po.status === 'RECEIVED' && (
                    <div className="flex items-center gap-1 text-green-600 text-sm font-medium ml-auto justify-end">
                      <CheckCircle2 className="w-4 h-4" />
                      Stock Added
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filteredPOs.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No purchase orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create PO Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-indigo-600 text-white">
                <h2 className="text-xl font-bold">Create Purchase Order</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreatePO} className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Select Supplier</label>
                    <select
                      required
                      value={selectedSupplierId}
                      onChange={(e) => setSelectedSupplierId(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    >
                      <option value="">Choose a supplier...</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Branch</label>
                    <input
                      disabled
                      value={currentUser.branchId === 'b1' ? 'Main Store' : 'Westside Branch'}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Package className="w-5 h-5 text-indigo-500" />
                      Order Items
                    </h3>
                    <button
                      type="button"
                      onClick={addItemToPO}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add Product
                    </button>
                  </div>

                  <div className="space-y-3">
                    {poItems.map((item, index) => (
                      <div key={index} className="flex gap-3 items-end bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="flex-1 space-y-1">
                          <label className="text-xs font-medium text-gray-500 uppercase">Product</label>
                          <select
                            required
                            value={item.productId}
                            onChange={(e) => updateItem(index, 'productId', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white"
                          >
                            <option value="">Select Product</option>
                            {inventory.map(p => (
                              <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                            ))}
                          </select>
                        </div>
                        <div className="w-24 space-y-1">
                          <label className="text-xs font-medium text-gray-500 uppercase">Qty</label>
                          <input
                            required
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white"
                          />
                        </div>
                        <div className="w-32 space-y-1">
                          <label className="text-xs font-medium text-gray-500 uppercase">Unit Price</label>
                          <input
                            required
                            type="number"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white"
                          />
                        </div>
                        <div className="w-32 space-y-1">
                          <label className="text-xs font-medium text-gray-500 uppercase">Total</label>
                          <div className="w-full px-3 py-2 bg-gray-100 border border-transparent rounded-lg text-gray-600 font-medium">
                            ₹{(item.quantity * item.unitPrice).toLocaleString()}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors mb-0.5"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    {poItems.length === 0 && (
                      <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
                        No items added yet. Click "Add Product" to start.
                      </div>
                    )}
                  </div>
                </div>
              </form>

              <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                <div className="text-gray-600">
                  Total Amount: <span className="text-xl font-bold text-gray-900 ml-2">₹{poItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toLocaleString()}</span>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreatePO}
                    disabled={!selectedSupplierId || poItems.length === 0}
                    className="px-8 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send Purchase Order
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {isSmartPOOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                   <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                     <Zap className="w-5 h-5 text-emerald-500 fill-emerald-500/10" />
                     Smart Procurement Suggestions
                   </h3>
                   <p className="text-sm text-gray-500">Heuristic engine based on low stock alerts and threshold rules.</p>
                </div>
                <button onClick={() => setIsSmartPOOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X className="w-5 h-5" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 gap-4">
                  {suggestions.length === 0 ? (
                    <div className="py-20 text-center text-gray-400">
                      <CheckCircle2 className="w-12 h-12 text-emerald-500/20 mx-auto mb-4" />
                      <p className="font-medium">All stock levels are optimal.</p>
                      <p className="text-sm">No items currently below their thresholds.</p>
                    </div>
                  ) : suggestions.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-2xl hover:border-emerald-200 hover:bg-emerald-50/30 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm">
                          <Package className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{s.productName}</p>
                          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                             <span className="text-rose-500">Stock: {s.currentStock}</span>
                             <span>Min: {s.threshold}</span>
                             <span className="text-emerald-600 font-black">Suggest: +{s.suggestedQuantity}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                         <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Est. Cost</p>
                            <p className="text-sm font-black text-slate-900">₹{(s.suggestedQuantity * s.lastPurchasePrice).toLocaleString()}</p>
                         </div>
                         <button 
                           onClick={() => createPOFromSuggestion(s)}
                           className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-2 group-hover:scale-105"
                         >
                           Generate PO
                           <ArrowRight className="w-4 h-4" />
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
                <button 
                  onClick={() => setIsSmartPOOpen(false)}
                   className="px-6 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-100 font-bold transition-all"
                >
                  Close Engine
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

