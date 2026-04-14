import React, { useEffect, useState } from 'react';
import { 
  Shield, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Settings,
  Lock,
  Eye,
  PlusCircle,
  FileEdit,
  Trash,
  CheckCircle2
} from 'lucide-react';
import { fetchRoles, createRole, updateRole, deleteRole, ROLE_TEMPLATES } from '../services/api';
import { Role, ModuleName, ActionType, Permission } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { BookOpen } from 'lucide-react';

const MODULES: { id: ModuleName; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'pos', label: 'POS' },
  { id: 'orders', label: 'Orders' },
  { id: 'customers', label: 'Customers' },
  { id: 'payments', label: 'Payments' },
  { id: 'refunds', label: 'Refunds' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'reports', label: 'Reports' },
  { id: 'forecasting', label: 'Forecasting' },
  { id: 'performance', label: 'Performance' },
  { id: 'rbac', label: 'Role Management' },
];

const ACTIONS: { id: ActionType; label: string; icon: any }[] = [
  { id: 'view', label: 'View', icon: Eye },
  { id: 'create', label: 'Create', icon: PlusCircle },
  { id: 'edit', label: 'Edit', icon: FileEdit },
  { id: 'delete', label: 'Delete', icon: Trash },
  { id: 'approve', label: 'Approve', icon: CheckCircle2 },
];

export const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const data = await fetchRoles();
      setRoles(data);
    } catch (error) {
      console.error('Failed to load roles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;

    try {
      if (editingRole.id) {
        await updateRole(editingRole);
      } else {
        await createRole(editingRole);
      }
      setIsModalOpen(false);
      setEditingRole(null);
      loadRoles();
    } catch (error) {
      console.error('Failed to save role:', error);
    }
  };

  const handleDeleteRole = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;
    try {
      await deleteRole(id);
      loadRoles();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete role');
    }
  };

  const togglePermission = (module: ModuleName, action: ActionType) => {
    if (!editingRole) return;

    const currentPermissions = [...editingRole.permissions];
    const moduleIndex = currentPermissions.findIndex(p => p.module === module);

    if (moduleIndex === -1) {
      currentPermissions.push({ module, actions: [action] });
    } else {
      const actions = [...currentPermissions[moduleIndex].actions];
      const actionIndex = actions.indexOf(action);
      if (actionIndex === -1) {
        actions.push(action);
      } else {
        actions.splice(actionIndex, 1);
      }
      
      if (actions.length === 0) {
        currentPermissions.splice(moduleIndex, 1);
      } else {
        currentPermissions[moduleIndex] = { ...currentPermissions[moduleIndex], actions };
      }
    }

    setEditingRole({ ...editingRole, permissions: currentPermissions });
  };

  const hasPermission = (module: ModuleName, action: ActionType) => {
    if (!editingRole) return false;
    const permission = editingRole.permissions.find(p => p.module === module);
    return permission?.actions.includes(action) || false;
  };

  if (loading && roles.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="role-management">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            Role Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">Define system roles and their granular permissions</p>
        </div>
        <button
          onClick={() => {
            setEditingRole({ id: '', name: '', description: '', permissions: [] });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
        >
          <Plus className="w-4 h-4" />
          Create New Role
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <motion.div
            key={role.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 rounded-xl">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingRole(role);
                    setIsModalOpen(true);
                  }}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {!role.isSystem && (
                  <button
                    onClick={() => handleDeleteRole(role.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900">{role.name}</h3>
            <p className="text-sm text-gray-500 mt-1 mb-4">{role.description}</p>
            
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Permissions Summary</p>
              <div className="flex flex-wrap gap-2">
                {role.permissions.slice(0, 4).map((p) => (
                  <span key={p.module} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold uppercase">
                    {p.module}
                  </span>
                ))}
                {role.permissions.length > 4 && (
                  <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-[10px] font-bold uppercase">
                    +{role.permissions.length - 4} more
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Role Editor Modal */}
      <AnimatePresence>
        {isModalOpen && editingRole && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  {editingRole.id ? 'Edit Role' : 'Create New Role'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSaveRole} className="flex-1 overflow-y-auto p-6 space-y-8">
                {!editingRole.id && (
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-bold text-blue-900">Quick Setup: Role Templates</p>
                        <p className="text-xs text-blue-700">Load a predefined set of permissions</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {Object.entries(ROLE_TEMPLATES).map(([key, template]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setEditingRole({
                            ...editingRole,
                            name: template.name || '',
                            description: template.description || '',
                            permissions: template.permissions || []
                          })}
                          className="px-3 py-1.5 bg-white text-blue-600 border border-blue-200 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        >
                          {template.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Role Name</label>
                    <input
                      required
                      type="text"
                      value={editingRole.name}
                      onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="e.g. Senior Manager"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Description</label>
                    <input
                      required
                      type="text"
                      value={editingRole.description}
                      onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="Briefly describe role responsibilities"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-500" />
                      Module Permissions
                    </h4>
                    <span className="text-xs text-gray-500 italic">Toggle actions to grant/revoke access</span>
                  </div>

                  <div className="border border-gray-100 rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Module</th>
                          {ACTIONS.map(action => (
                            <th key={action.id} className="px-4 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                              <div className="flex flex-col items-center gap-1">
                                <action.icon className="w-3 h-3" />
                                {action.label}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {MODULES.map(module => (
                          <tr key={module.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <span className="text-sm font-bold text-gray-700">{module.label}</span>
                            </td>
                            {ACTIONS.map(action => (
                              <td key={action.id} className="px-4 py-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => togglePermission(module.id, action.id)}
                                  className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all mx-auto",
                                    hasPermission(module.id, action.id)
                                      ? "bg-blue-600 text-white shadow-sm"
                                      : "bg-gray-100 text-gray-300 hover:bg-gray-200"
                                  )}
                                >
                                  <Check className={cn("w-4 h-4", hasPermission(module.id, action.id) ? "opacity-100" : "opacity-0")} />
                                </button>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </form>

              <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRole}
                  className="px-8 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                >
                  Save Role Configuration
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
