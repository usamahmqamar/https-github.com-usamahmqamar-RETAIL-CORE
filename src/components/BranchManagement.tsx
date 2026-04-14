import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  MapPin, 
  Phone, 
  Edit2, 
  Trash2, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Users,
  TrendingUp
} from 'lucide-react';
import { Branch, User } from '../types';
import { fetchBranches, hasPermission } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';

interface BranchManagementProps {
  currentUser: User;
}

export const BranchManagement: React.FC<BranchManagementProps> = ({ currentUser }) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBranch, setNewBranch] = useState<Omit<Branch, 'id'>>({
    name: '',
    location: '',
    phone: '',
    isActive: true
  });

  const canManage = hasPermission(currentUser, 'branches', 'edit');

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      const data = await fetchBranches();
      setBranches(data);
    } catch (error) {
      console.error('Failed to load branches', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, call API
    const branch: Branch = {
      ...newBranch,
      id: `b${Math.random().toString(36).substr(2, 9)}`
    };
    setBranches([...branches, branch]);
    setIsModalOpen(false);
    setNewBranch({ name: '', location: '', phone: '', isActive: true });
  };

  const filteredBranches = branches.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-600" />
            Branch Management
          </h1>
          <p className="text-sm text-gray-500">Manage multiple store locations and branches</p>
        </div>
        {canManage && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Branch
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search branches by name or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBranches.map((branch) => (
          <motion.div
            key={branch.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 group-hover:opacity-10 transition-opacity ${branch.isActive ? 'bg-emerald-500' : 'bg-gray-500'}`} />
            
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${branch.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>
                <Building2 className="w-6 h-6" />
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${branch.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                {branch.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-1">{branch.name}</h3>
            <div className="space-y-3 mt-4">
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <span>{branch.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{branch.phone}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-gray-50">
              <div className="bg-gray-50 p-3 rounded-xl">
                <div className="text-xs text-gray-400 uppercase font-medium mb-1 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Staff
                </div>
                <div className="text-lg font-bold text-gray-900">12</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl">
                <div className="text-xs text-gray-400 uppercase font-medium mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Sales
                </div>
                <div className="text-lg font-bold text-gray-900">₹4.2L</div>
              </div>
            </div>

            {canManage && (
              <div className="mt-4 flex gap-2">
                <button className="flex-1 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-100">
                  Edit Details
                </button>
                <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Add Branch Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Add New Branch</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateBranch} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Branch Name</label>
                  <input
                    required
                    type="text"
                    value={newBranch.name}
                    onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    placeholder="e.g., South Extension Branch"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Location Address</label>
                  <textarea
                    required
                    value={newBranch.location}
                    onChange={(e) => setNewBranch({ ...newBranch, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none h-24 resize-none"
                    placeholder="Full address of the branch..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Contact Phone</label>
                  <input
                    required
                    type="tel"
                    value={newBranch.phone}
                    onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    placeholder="555-0100"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={newBranch.isActive}
                    onChange={(e) => setNewBranch({ ...newBranch, isActive: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-600">Mark as Active immediately</label>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    Create Branch
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

export default BranchManagement;
