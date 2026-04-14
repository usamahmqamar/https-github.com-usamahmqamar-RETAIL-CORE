import React, { useEffect, useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  MoreVertical, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Search,
  Filter,
  ChevronDown
} from 'lucide-react';
import { fetchUsers, fetchRoles, createUser, updateUser, deleteUser, fetchBranches } from '../services/api';
import { User, Role, Branch } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, rolesData, branchesData] = await Promise.all([
        fetchUsers(), 
        fetchRoles(),
        fetchBranches()
      ]);
      setUsers(usersData);
      setRoles(rolesData);
      setBranches(branchesData);
    } catch (error) {
      console.error('Failed to load users/roles/branches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      if (editingUser.id) {
        await updateUser(editingUser);
      } else {
        await createUser(editingUser);
      }
      setIsModalOpen(false);
      setEditingUser(null);
      loadData();
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteUser(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const toggleUserStatus = async (user: User) => {
    try {
      await updateUser({ ...user, isActive: !user.isActive });
      loadData();
    } catch (error) {
      console.error('Failed to toggle user status:', error);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleName = (roleId: string) => {
    return roles.find(r => r.id === roleId)?.name || 'Unknown Role';
  };

  const getBranchName = (branchId: string) => {
    return branches.find(b => b.id === branchId)?.name || 'Global / All Branches';
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="user-management">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Employee Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">Manage employee accounts, roles, and access status</p>
        </div>
        <button
          onClick={() => {
            setEditingUser({ id: '', name: '', email: '', roleId: roles[0]?.id || '', isActive: true });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
        >
          <UserPlus className="w-4 h-4" />
          Add New Employee
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex flex-col md:flex-row gap-4 justify-between bg-gray-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
              <Filter className="w-4 h-4" />
              Filter
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Employee</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Branch</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold flex items-center gap-1 w-fit">
                      <Shield className="w-3 h-3" />
                      {getRoleName(user.roleId)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {getBranchName(user.branchId)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <button
                        onClick={() => toggleUserStatus(user)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all",
                          user.isActive 
                            ? "bg-green-50 text-green-600 hover:bg-green-100" 
                            : "bg-red-50 text-red-600 hover:bg-red-100"
                        )}
                      >
                        {user.isActive ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            Inactive
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
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

      {/* User Editor Modal */}
      <AnimatePresence>
        {isModalOpen && editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingUser.id ? 'Edit Employee' : 'Add New Employee'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSaveUser} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Full Name</label>
                  <input
                    required
                    type="text"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="e.g. John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Email Address</label>
                  <input
                    required
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="john@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Assign Role</label>
                  <select
                    required
                    value={editingUser.roleId}
                    onChange={(e) => setEditingUser({ ...editingUser, roleId: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  >
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Assign Branch</label>
                  <select
                    required
                    value={editingUser.branchId}
                    onChange={(e) => setEditingUser({ ...editingUser, branchId: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  >
                    <option value="">Global / All Branches</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={editingUser.isActive}
                    onChange={(e) => setEditingUser({ ...editingUser, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-bold text-gray-700">Account Active</label>
                </div>

                <div className="pt-6 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                  >
                    Save Employee
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
