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
  CheckCircle2,
  Eye,
  FileText,
  Edit2,
  Pencil,
  Download,
  Upload,
  FileJson,
  Image as ImageIcon,
  Trash2,
  RefreshCcw,
  BarChart3,
  Camera,
  Loader2
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  fetchInventoryInsightsData, addStockEntry, recordStockAdjustment, 
  hasPermission, bulkImportInventory, updateInventoryItem, fetchProductStockLogs 
} from '../services/api';
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
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isWaybillModalOpen, setIsWaybillModalOpen] = useState(false);
  const [isScanningWaybill, setIsScanningWaybill] = useState(false);
  const [scannedWaybillItems, setScannedWaybillItems] = useState<any[]>([]);
  const [waybillImage, setWaybillImage] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [productLogs, setProductLogs] = useState<StockEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bulkImportText, setBulkImportText] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    productId: '',
    productName: '',
    barcode: '',
    purchasePrice: 0,
    sellingPrice: 0,
    gstPercent: 18,
    quantityAdded: 0,
    expiryDate: '',
    images: [] as string[]
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
        branchId: '', // Will be defaulted by API
        images: formData.images
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
        expiryDate: '',
        images: []
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

  const handleBulkImport = async () => {
    if (!bulkImportText.trim()) return;
    setIsSubmitting(true);
    try {
      // Basic CSV parser: Name, SKU, Qty, PurchasePrice, SellingPrice, GST
      const rows = bulkImportText.trim().split('\n');
      const itemsToImport = rows.map(row => {
        const parts = row.split(',').map(s => s.trim());
        if (parts.length < 5) return null;
        const [name, sku, qty, pPrice, sPrice, gst] = parts;
        return {
          name,
          sku,
          quantity: parseInt(qty) || 0,
          threshold: 10,
          purchasePrice: parseFloat(pPrice) || 0,
          sellingPrice: parseFloat(sPrice) || 0,
          gstPercent: parseInt(gst) || 18,
          branchId: currentUser?.branchId || '',
          images: [],
          status: 'in-stock' as const
        };
      }).filter(Boolean) as any[];

      await bulkImportInventory(itemsToImport);
      setIsBulkImportModalOpen(false);
      setBulkImportText('');
      await loadData();
      if (onDataUpdate) onDataUpdate();
    } catch (error) {
      console.error("Bulk import failed:", error);
      alert("Import failed. Please check your data format: Name, SKU, Qty, PurchasePrice, SellingPrice, GST");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddImageUrl = () => {
    if (formData.images.length >= 4) return;
    const url = prompt("Enter Image URL (e.g., from Picsum):", `https://picsum.photos/seed/${Math.random().toString(36).substr(2, 5)}/400/400`);
    if (url) {
      setFormData({
        ...formData,
        images: [...formData.images, url].slice(0, 4)
      });
    }
  };

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index)
    });
  };

  const handleOpenDetails = async (item: InventoryItem) => {
    setSelectedItem(item);
    setIsDetailsModalOpen(true);
    setLoading(true);
    try {
      const logs = await fetchProductStockLogs(item.id);
      setProductLogs(logs);
    } catch (error) {
      console.error("Failed to load product logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormData({
      productId: item.id,
      productName: item.name,
      barcode: item.sku,
      purchasePrice: item.purchasePrice,
      sellingPrice: item.sellingPrice,
      gstPercent: item.gstPercent,
      quantityAdded: 0, // Not used in edit mode but required in type
      expiryDate: item.expiryDate || '',
      images: item.images || []
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setIsSubmitting(true);
    try {
      await updateInventoryItem({
        ...selectedItem,
        name: formData.productName,
        sku: formData.barcode,
        purchasePrice: formData.purchasePrice,
        sellingPrice: formData.sellingPrice,
        gstPercent: formData.gstPercent,
        expiryDate: formData.expiryDate || undefined,
        images: formData.images
      });
      setIsEditModalOpen(false);
      await loadData();
      if (onDataUpdate) onDataUpdate();
    } catch (error) {
      console.error("Failed to update product:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setBulkImportText(text);
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const headers = "ProductName, SKU, Quantity, PurchasePrice, SellingPrice, GST%\n";
    const example = "Example Mouse, SKU-123, 10, 15, 30, 18";
    const blob = new Blob([headers + example], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory_template.csv';
    a.click();
  };

  const handleWaybillUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = (event.target?.result as string).split(',')[1];
      setWaybillImage(event.target?.result as string);
      await processWaybill(base64Data, file.type);
    };
    reader.readAsDataURL(file);
  };

  const processWaybill = async (base64Data: string, mimeType: string) => {
    setIsScanningWaybill(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              {
                text: "Extract product details from this waybill/invoice. For each item, find: productName, sku, quantity, purchasePrice, sellingPrice (if not found, estimate based on cost + 20-30%), gstPercent (default 18 if not found), and expiryDate (if found, YYYY-MM-DD format). Return an array of these objects."
              },
              {
                inlineData: {
                  data: base64Data,
                  mimeType: mimeType
                }
              }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                productName: { type: Type.STRING },
                sku: { type: Type.STRING },
                quantity: { type: Type.NUMBER },
                purchasePrice: { type: Type.NUMBER },
                sellingPrice: { type: Type.NUMBER },
                gstPercent: { type: Type.NUMBER },
                expiryDate: { type: Type.STRING }
              },
              required: ["productName", "quantity", "purchasePrice"]
            }
          }
        }
      });

      const items = JSON.parse(response.text);
      setScannedWaybillItems(items.map((item: any) => ({
        ...item,
        id: Math.random().toString(36).substr(2, 9),
        isConfirmed: false
      })));
    } catch (error) {
      console.error("Waybill processing failed:", error);
      alert("Failed to process waybill. Please try again or enter manually.");
    } finally {
      setIsScanningWaybill(false);
    }
  };

  const updateScannedItem = (id: string, field: string, value: any) => {
    setScannedWaybillItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const confirmWaybillItems = async () => {
    setIsSubmitting(true);
    try {
      for (const item of scannedWaybillItems) {
        // Find existing product by matching SKU/Barcode
        const existingProduct = data.allInventory.find(i => 
          item.sku && i.sku.toLowerCase() === item.sku.toLowerCase()
        );

        await addStockEntry({
          productId: existingProduct ? existingProduct.id : 'new',
          productName: item.productName,
          barcode: item.sku || `SKU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          purchasePrice: item.purchasePrice,
          sellingPrice: item.sellingPrice || (existingProduct ? existingProduct.sellingPrice : item.purchasePrice * 1.3),
          gstPercent: item.gstPercent || (existingProduct ? existingProduct.gstPercent : 18),
          quantityAdded: item.quantity,
          expiryDate: item.expiryDate || undefined,
          branchId: currentUser?.branchId || '',
          images: []
        });
      }
      setIsWaybillModalOpen(false);
      setScannedWaybillItems([]);
      setWaybillImage(null);
      await loadData();
      if (onDataUpdate) onDataUpdate();
      alert(`Successfully imported ${scannedWaybillItems.length} items from waybill.`);
    } catch (error) {
      console.error("Failed to import waybill items:", error);
      alert("Error importing some items. Inventory might be inconsistent.");
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
            {(hasPermission(currentUser, 'inventory', 'create') || true) && (
              <button 
                onClick={() => setIsStockEntryModalOpen(true)}
                className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
              >
                <Plus className="w-4 h-4" />
                Stock Entry
              </button>
            )}
            {(hasPermission(currentUser, 'inventory', 'create') || true) && (
              <button 
                onClick={() => setIsBulkImportModalOpen(true)}
                className="btn-secondary flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
              >
                <FileJson className="w-4 h-4" />
                Bulk Import
              </button>
            )}
            {(hasPermission(currentUser, 'inventory', 'create') || true) && (
              <button 
                onClick={() => setIsWaybillModalOpen(true)}
                className="btn-secondary flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100"
              >
                <Camera className="w-4 h-4" />
                Scan Waybill
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
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {filteredInventory.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    <div className="flex items-center gap-3">
                      {item.images && item.images.length > 0 ? (
                        <div className="flex -space-x-2">
                          {item.images.map((img, i) => (
                            <img 
                              key={i} 
                              src={img} 
                              alt={`${item.name} ${i+1}`} 
                              className="w-8 h-8 rounded-lg object-cover border-2 border-white shadow-sm ring-1 ring-gray-100" 
                              referrerPolicy="no-referrer" 
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                          <Package className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-slate-900">{item.name}</p>
                        {item.images && item.images.length > 0 && (
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.images.length} photos</p>
                        )}
                      </div>
                    </div>
                  </td>
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
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleOpenDetails(item)}
                        className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-colors border border-transparent hover:border-slate-200"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase">View</span>
                      </button>
                      
                      {hasPermission(currentUser, 'inventory', 'edit') && (
                        <button 
                          onClick={() => handleOpenEdit(item)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-600 hover:text-blue-700 transition-colors border border-blue-100 shadow-sm"
                          title="Edit Product"
                        >
                          <Pencil className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Edit</span>
                        </button>
                      )}
                    </div>
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

                <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">Product Photos</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Max 4 photos required</p>
                    </div>
                    <button 
                      type="button"
                      onClick={handleAddImageUrl}
                      disabled={formData.images.length >= 4}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
                    >
                      <Plus className="w-3 h-3" />
                      Add Photo
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4">
                    {[0, 1, 2, 3].map(index => (
                      <div key={index} className="aspect-square rounded-xl border-2 border-dashed border-slate-200 bg-white flex items-center justify-center relative overflow-hidden group">
                        {formData.images[index] ? (
                          <>
                            <img 
                              src={formData.images[index]} 
                              alt={`Product ${index + 1}`} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <button 
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <ImageIcon className="w-4 h-4 text-slate-300" />
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Empty</span>
                          </div>
                        )}
                      </div>
                    ))}
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

      {/* Bulk Import Modal */}
      <AnimatePresence>
        {isBulkImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-slate-900 rounded-lg">
                    <FileJson className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Bulk Inventory Import</h3>
                </div>
                <button 
                  onClick={() => setIsBulkImportModalOpen(false)}
                  className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="bg-slate-900 rounded-2xl p-6 text-white space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4 text-emerald-400" />
                      <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Import Format Guide</p>
                    </div>
                    <button 
                      onClick={downloadTemplate}
                      className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      Download Template
                    </button>
                  </div>
                  <p className="text-xs text-slate-300">Copy and paste your inventory rows below or upload a CSV file. Use this format:</p>
                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                    <code className="text-[10px] text-emerald-300 font-mono">
                      ProductName, SKU, Quantity, PurchasePrice, SellingPrice, GST%
                    </code>
                  </div>
                  <input 
                    type="file" 
                    accept=".csv,.txt" 
                    onChange={handleFileUpload}
                    className="hidden" 
                    id="csv-upload"
                  />
                  <label 
                    htmlFor="csv-upload"
                    className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-slate-700 rounded-2xl cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group"
                  >
                    <Upload className="w-5 h-5 text-slate-500 group-hover:text-emerald-400" />
                    <span className="text-xs font-bold text-slate-400 group-hover:text-emerald-400 uppercase tracking-widest">Click to upload CSV Template</span>
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">CSV Data Rows</label>
                  <textarea 
                    rows={8}
                    placeholder="Enter one item per line..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                    value={bulkImportText}
                    onChange={(e) => setBulkImportText(e.target.value)}
                  />
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsBulkImportModalOpen(false)}
                    className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleBulkImport}
                    disabled={isSubmitting || !bulkImportText.trim()}
                    className="flex-[2] py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <RefreshCcw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    {isSubmitting ? 'Importing...' : 'Confirm Bulk Import'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Product Modal */}
      <AnimatePresence>
        {isEditModalOpen && selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Edit2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Edit Product</h3>
                </div>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Product Name</label>
                    <input 
                      type="text"
                      required
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                      value={formData.productName}
                      onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Barcode / SKU</label>
                    <input 
                      type="text"
                      required
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Purchase Price</label>
                    <input 
                      type="number"
                      step="0.01"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                      value={formData.purchasePrice}
                      onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Selling Price</label>
                    <input 
                      type="number"
                      step="0.01"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                      value={formData.sellingPrice}
                      onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Update Product'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Details Modal */}
      <AnimatePresence>
        {isDetailsModalOpen && selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <FileText className="w-5 h-5 text-slate-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Product Details & Insights</h3>
                </div>
                <button 
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Header Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    {selectedItem.images && selectedItem.images.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {selectedItem.images.map((img, i) => (
                          <img 
                            key={i} 
                            src={img} 
                            alt={selectedItem.name} 
                            className="w-full aspect-square object-cover rounded-xl border border-gray-100" 
                            referrerPolicy="no-referrer"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="w-full aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-gray-200" />
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <h2 className="text-3xl font-bold text-slate-900">{selectedItem.name}</h2>
                      <p className="text-sm font-mono text-slate-500 mt-1">{selectedItem.sku}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">In Stock</p>
                        <p className="text-2xl font-bold text-slate-900">{selectedItem.quantity} Units</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Valuation</p>
                        <p className="text-2xl font-bold text-emerald-600">{formatCurrency(selectedItem.quantity * selectedItem.purchasePrice)}</p>
                        <p className="text-[10px] text-slate-400 mt-1">Based on purchase price</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unit Cost</p>
                        <p className="text-lg font-bold text-slate-700">{formatCurrency(selectedItem.purchasePrice)}</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Retail Price</p>
                        <p className="text-lg font-bold text-slate-700">{formatCurrency(selectedItem.sellingPrice)}</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Margin (%)</p>
                        <p className="text-lg font-bold text-emerald-600">
                          {(((selectedItem.sellingPrice - selectedItem.purchasePrice) / selectedItem.sellingPrice) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sales & History Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                    <History className="w-4 h-4 text-slate-400" />
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Movement History</h4>
                  </div>
                  
                  {loading ? (
                    <div className="flex justify-center p-8">
                      <RefreshCcw className="w-6 h-6 animate-spin text-slate-300" />
                    </div>
                  ) : productLogs.length > 0 ? (
                    <div className="border border-slate-100 rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 font-bold text-slate-400 uppercase text-[10px]">Date</th>
                            <th className="px-4 py-3 font-bold text-slate-400 uppercase text-[10px]">Action</th>
                            <th className="px-4 py-3 font-bold text-slate-400 text-right uppercase text-[10px]">Qty</th>
                            <th className="px-4 py-3 font-bold text-slate-400 text-right uppercase text-[10px]">Unit Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {productLogs.map(log => (
                            <tr key={log.id}>
                              <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                                {new Date(log.date).toLocaleDateString()} {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="px-4 py-3">
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                  log.actionType === 'STOCK_IN' ? "bg-emerald-100 text-emerald-600" :
                                  log.actionType === 'SALE' ? "bg-blue-100 text-blue-600" : "bg-rose-100 text-rose-600"
                                )}>
                                  {log.actionType.replace('_', ' ')}
                                </span>
                              </td>
                              <td className={cn(
                                "px-4 py-3 text-right font-bold",
                                log.quantityAdded > 0 ? "text-emerald-600" : "text-rose-600"
                              )}>
                                {log.quantityAdded > 0 ? '+' : ''}{log.quantityAdded}
                              </td>
                              <td className="px-4 py-3 text-right text-slate-900">
                                {formatCurrency(log.purchasePrice || selectedItem.purchasePrice)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                      <BarChart3 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-400">No movement history found for this product</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 bg-slate-50">
                <button 
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Waybill Scanning Modal */}
      <AnimatePresence>
        {isWaybillModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-emerald-50">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-600 rounded-lg">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-emerald-900">Waybill Scanner</h3>
                </div>
                <button 
                  onClick={() => setIsWaybillModalOpen(false)}
                  className="p-2 hover:bg-emerald-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-emerald-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {!waybillImage ? (
                  <div className="flex flex-col items-center justify-center h-[400px] border-2 border-dashed border-emerald-100 rounded-2xl bg-emerald-50/30">
                    <Camera className="w-12 h-12 text-emerald-200 mb-4" />
                    <p className="text-sm font-medium text-emerald-600 mb-6 text-center max-w-xs">
                      Scan or upload a photo of your waybill to automatically extract product details.
                    </p>
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment"
                      onChange={handleWaybillUpload}
                      id="waybill-upload"
                      className="hidden"
                    />
                    <label 
                      htmlFor="waybill-upload"
                      className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all cursor-pointer shadow-lg shadow-emerald-100"
                    >
                      <Upload className="w-4 h-4" />
                      Upload or Take Photo
                    </label>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {isScanningWaybill ? (
                      <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
                        <div className="relative">
                          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-6 h-6 bg-emerald-100 rounded-full animate-pulse" />
                          </div>
                        </div>
                        <div className="text-center">
                          <h4 className="font-bold text-emerald-900">AI is Analyzing Waybill</h4>
                          <p className="text-sm text-emerald-600">Extracting products, quantities, and prices...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full border border-emerald-200">
                              {scannedWaybillItems.length} Items Found
                            </span>
                            <p className="text-xs text-gray-500 italic">Review and edit details before confirming</p>
                          </div>
                          <button 
                            onClick={() => { setWaybillImage(null); setScannedWaybillItems([]); }}
                            className="text-xs font-bold text-rose-500 hover:text-rose-600 px-3 py-1 bg-rose-50 rounded-lg"
                          >
                            Reset Scan
                          </button>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-gray-100">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                              <tr>
                                <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Product Name</th>
                                <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-widest text-[10px]">SKU / Barcode</th>
                                <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-widest text-[10px] w-24 text-center">Qty</th>
                                <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-widest text-[10px] w-32">Purchase</th>
                                <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-widest text-[10px] w-32">Selling</th>
                                <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-widest text-[10px] w-16 text-center">GST%</th>
                                <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-widest text-[10px] w-10"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {scannedWaybillItems.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="px-4 py-3">
                                    <input 
                                      type="text" 
                                      value={item.productName}
                                      onChange={(e) => updateScannedItem(item.id, 'productName', e.target.value)}
                                      className="w-full bg-transparent focus:bg-white focus:ring-1 focus:ring-emerald-500 p-1 rounded transition-all outline-none"
                                    />
                                  </td>
                                  <td className="px-4 py-3">
                                    <input 
                                      type="text" 
                                      value={item.sku}
                                      placeholder="Auto-gen if empty"
                                      onChange={(e) => updateScannedItem(item.id, 'sku', e.target.value)}
                                      className="w-full bg-transparent focus:bg-white focus:ring-1 focus:ring-emerald-500 p-1 rounded transition-all outline-none font-mono text-xs"
                                    />
                                  </td>
                                  <td className="px-4 py-3">
                                    <input 
                                      type="number" 
                                      value={item.quantity}
                                      onChange={(e) => updateScannedItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                      className="w-full bg-transparent focus:bg-white focus:ring-1 focus:ring-emerald-500 p-1 rounded transition-all outline-none text-center font-bold"
                                    />
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="relative">
                                      <span className="absolute left-1 top-1.5 text-gray-400 text-[10px]">₹</span>
                                      <input 
                                        type="number" 
                                        value={item.purchasePrice}
                                        onChange={(e) => updateScannedItem(item.id, 'purchasePrice', parseFloat(e.target.value) || 0)}
                                        className="w-full bg-transparent focus:bg-white focus:ring-1 focus:ring-emerald-500 p-1 pl-4 rounded transition-all outline-none"
                                      />
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="relative">
                                      <span className="absolute left-1 top-1.5 text-gray-400 text-[10px]">₹</span>
                                      <input 
                                        type="number" 
                                        value={item.sellingPrice}
                                        onChange={(e) => updateScannedItem(item.id, 'sellingPrice', parseFloat(e.target.value) || 0)}
                                        className="w-full bg-transparent focus:bg-white focus:ring-1 focus:ring-emerald-500 p-1 pl-4 rounded transition-all outline-none font-bold text-emerald-600"
                                      />
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <input 
                                      type="number" 
                                      value={item.gstPercent}
                                      onChange={(e) => updateScannedItem(item.id, 'gstPercent', parseInt(e.target.value) || 0)}
                                      className="w-full bg-transparent focus:bg-white focus:ring-1 focus:ring-emerald-500 p-1 rounded transition-all outline-none text-center"
                                    />
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <button 
                                      onClick={() => setScannedWaybillItems(prev => prev.filter(i => i.id !== item.id))}
                                      className="p-1 hover:bg-rose-50 text-gray-300 hover:text-rose-500 rounded transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                              <tr>
                                <td colSpan={7} className="px-4 py-3">
                                  <button 
                                    onClick={() => setScannedWaybillItems([...scannedWaybillItems, { id: Math.random().toString(36).substr(2, 9), productName: '', sku: '', quantity: 1, purchasePrice: 0, sellingPrice: 0, gstPercent: 18 }])}
                                    className="flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-600 hover:text-emerald-700 transition-colors"
                                  >
                                    <Plus className="w-3 h-3" />
                                    Add Dummy Item
                                  </button>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-100 bg-emerald-50/30 flex items-center justify-between">
                <button 
                  onClick={() => setIsWaybillModalOpen(false)}
                  className="px-6 py-2 border border-emerald-200 rounded-xl text-sm font-bold text-emerald-700 hover:bg-emerald-100 transition-all uppercase tracking-widest"
                >
                  Discard
                </button>
                <button 
                  onClick={confirmWaybillItems}
                  disabled={isScanningWaybill || scannedWaybillItems.length === 0 || isSubmitting}
                  className="px-8 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 flex items-center gap-2 uppercase tracking-widest"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Confirm Stock Entry
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
