import React, { useState, useEffect } from 'react';
import { 
  Ticket, 
  Plus, 
  Search, 
  Calendar, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  XCircle,
  Clock,
  Tag,
  TrendingUp,
  Users,
  Percent,
  IndianRupee,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { PromoCode } from '../types';
import { fetchPromoCodes, savePromoCode, deletePromoCode } from '../services/api';

const MarketingManagement: React.FC = () => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<PromoCode>>({
    code: '',
    type: 'PERCENT',
    value: 0,
    minOrderAmount: 0,
    isActive: true,
    usageLimit: 100,
    usageCount: 0,
    expiryDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0]
  });

  useEffect(() => {
    loadPromos();
  }, []);

  const loadPromos = async () => {
    setLoading(true);
    const data = await fetchPromoCodes();
    setPromoCodes(data);
    setLoading(false);
  };

  const handleDeletePromo = async (id: string, code: string) => {
    if (window.confirm(`Are you sure you want to delete promo code ${code}?`)) {
      await deletePromoCode(id);
      await loadPromos();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const promo: PromoCode = {
      ...(editingPromo || {}),
      ...(formData as PromoCode),
      id: editingPromo?.id || `promo-${Date.now()}`,
      code: formData.code!.toUpperCase()
    };
    
    await savePromoCode(promo);
    await loadPromos();
    setIsFormOpen(false);
    setEditingPromo(null);
    setFormData({
      code: '',
      type: 'PERCENT',
      value: 0,
      minOrderAmount: 0,
      isActive: true,
      usageLimit: 100,
      usageCount: 0,
      expiryDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0]
    });
  };

  const filteredPromos = promoCodes.filter(p => 
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
            <TrendingUp className="w-8 h-8 text-emerald-400 mb-4" />
            <h3 className="text-3xl font-bold mb-1">24%</h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Conversion Uplift</p>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
         </div>
         <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
            <Users className="w-8 h-8 text-indigo-500 mb-4" />
            <h3 className="text-3xl font-bold mb-1">1,240</h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Active Coupon Users</p>
         </div>
         <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
               <Ticket className="w-8 h-8 text-orange-500 mb-4" />
               <button 
                onClick={() => { setEditingPromo(null); setIsFormOpen(true); }}
                className="p-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all"
               >
                 <Plus className="w-5 h-5" />
               </button>
            </div>
            <p className="text-slate-900 font-bold mb-1 uppercase tracking-tighter">Create Campaign</p>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Drive sales with discounts</p>
         </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
              <h2 className="text-xl font-bold text-slate-900">Campaigns & Promo Codes</h2>
              <p className="text-xs text-slate-400 font-medium">Manage active discount codes for your digital storefront.</p>
           </div>
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search codes..."
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Code</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Discount</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Requirement</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usage</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Expiry</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center">
                    <Loader2 className="w-8 h-8 text-slate-900 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-400 italic">Syncing marketing data...</p>
                  </td>
                </tr>
              ) : filteredPromos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center text-slate-400">
                    <Tag className="w-12 h-12 opacity-10 mx-auto mb-4" />
                    <p className="italic">No active campaigns found.</p>
                  </td>
                </tr>
              ) : filteredPromos.map(promo => (
                <tr key={promo.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                          <Ticket className="w-4 h-4" />
                       </div>
                       <span className="font-mono font-black text-slate-900">{promo.code}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      {promo.type === 'PERCENT' ? <Percent className="w-3.5 h-3.5" /> : '₹'}
                      {promo.value}{promo.type === 'PERCENT' ? '%' : ''}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xs text-slate-500 font-medium">Min Order: ₹{promo.minOrderAmount}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-400">
                        <span>{promo.usageCount} / {promo.usageLimit || '∞'}</span>
                        <span>{promo.usageLimit ? Math.round((promo.usageCount / promo.usageLimit) * 100) : 0}%</span>
                      </div>
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-slate-900 rounded-full transition-all duration-500" 
                          style={{ width: `${promo.usageLimit ? (promo.usageCount / promo.usageLimit) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(promo.expiryDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                     <span className={cn(
                       "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                       promo.isActive 
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
                        : "bg-slate-100 text-slate-500 border-slate-200"
                     )}>
                       {promo.isActive ? 'Active' : 'Paused'}
                     </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => { setEditingPromo(promo); setFormData(promo); setIsFormOpen(true); }}
                        className="p-2 hover:bg-white border hover:border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeletePromo(promo.id, promo.code)}
                        className="p-2 hover:bg-rose-50 border hover:border-rose-100 rounded-xl text-slate-400 hover:text-rose-600 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Promo Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-orange-500 shadow-sm border border-slate-100">
                       <Tag className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{editingPromo ? 'Edit Campaign' : 'New Campaign'}</h3>
                 </div>
                 <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-white rounded-xl text-slate-400"><XCircle className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                 <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Promo Code</label>
                        <input 
                          type="text" required placeholder="Ex: SUMMER20"
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-mono font-bold uppercase focus:outline-none focus:border-slate-900"
                          value={formData.code}
                          onChange={e => setFormData({ ...formData, code: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Discount Type</label>
                            <select 
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:outline-none"
                              value={formData.type}
                              onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                            >
                                <option value="PERCENT">Percentage (%)</option>
                                <option value="FIXED">Fixed Amount (₹)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Value</label>
                            <input 
                              type="number" required
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:outline-none"
                              value={formData.value}
                              onChange={e => setFormData({ ...formData, value: Number(e.target.value) })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Min Order (₹)</label>
                            <input 
                              type="number" required
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:outline-none"
                              value={formData.minOrderAmount}
                              onChange={e => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Usage Limit</label>
                            <input 
                              type="number" required
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:outline-none"
                              value={formData.usageLimit}
                              onChange={e => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Expiry Date</label>
                        <input 
                          type="date" required
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:outline-none"
                          value={formData.expiryDate}
                          onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                        />
                    </div>
                 </div>

                 <div className="flex items-center gap-3 pt-6 border-t border-slate-50">
                    <button 
                      type="submit"
                      className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                    >
                      {editingPromo ? 'Update Campaign' : 'Launch Campaign'}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 mt-0"
                    >
                      Discard
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

export default MarketingManagement;
