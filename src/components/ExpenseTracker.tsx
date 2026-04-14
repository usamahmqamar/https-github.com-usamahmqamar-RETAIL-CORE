import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Plus, 
  Calendar, 
  Tag, 
  IndianRupee, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Filter,
  Search,
  X,
  Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { fetchExpenseData, addExpense, hasPermission } from '../services/api';
import { Expense, ExpenseData, User as UserType } from '../types';
import { cn } from '../lib/utils';

interface ExpenseTrackerProps {
  currentUser: UserType | null;
}

export const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({ currentUser }) => {
  const [data, setData] = useState<ExpenseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: '',
    category: 'Utilities',
    date: new Date().toISOString().split('T')[0],
    status: 'paid' as const,
    recurring: false
  });

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const result = await fetchExpenseData();
      setData(result);
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.title || !newExpense.amount) return;

    try {
      const added = await addExpense({
        title: newExpense.title,
        amount: parseFloat(newExpense.amount),
        category: newExpense.category,
        date: newExpense.date,
        status: newExpense.status,
        recurring: newExpense.recurring,
        branchId: '' // Will be defaulted by API
      });

      if (data) {
        setData({
          ...data,
          expenses: [added, ...data.expenses],
          monthlyTotal: added.status !== 'upcoming' ? data.monthlyTotal + added.amount : data.monthlyTotal,
          upcomingTotal: (added.status === 'upcoming' || added.status === 'pending') ? data.upcomingTotal + added.amount : data.upcomingTotal
        });
      }
      
      setShowAddForm(false);
      setNewExpense({
        title: '',
        amount: '',
        category: 'Utilities',
        date: new Date().toISOString().split('T')[0],
        status: 'paid' as const,
        recurring: false
      });
    } catch (error) {
      console.error("Failed to add expense:", error);
    }
  };

  const filteredExpenses = data?.expenses.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         e.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || e.category === filterCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const categories = ['All', ...new Set(data?.expenses.map(e => e.category) || [])];

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Clock className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Current Month</span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Monthly Expenses</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">₹{data?.monthlyTotal.toLocaleString('en-IN')}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Pending/Upcoming</span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Upcoming Expenses</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">₹{data?.upcomingTotal.toLocaleString('en-IN')}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Efficiency</span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Expense Ratio</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">13.2%</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main List Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-blue-600" />
                Expense Log
              </h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Search expenses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 w-full md:w-48"
                  />
                </div>
                {hasPermission(currentUser, 'expenses', 'create') && (
                  <button 
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add New
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-gray-400 text-[11px] uppercase tracking-wider font-semibold">
                    <th className="px-6 py-4">Expense Details</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            expense.recurring ? "bg-purple-50 text-purple-600" : "bg-gray-50 text-gray-600"
                          )}>
                            <Receipt className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{expense.title}</p>
                            {expense.recurring && <span className="text-[10px] text-purple-500 font-medium">Recurring</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">
                        ₹{expense.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <div className={cn(
                          "flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider",
                          expense.status === 'paid' ? "text-emerald-600" : 
                          expense.status === 'pending' ? "text-amber-600" : "text-blue-600"
                        )}>
                          {expense.status === 'paid' ? <CheckCircle2 className="w-3 h-3" /> : 
                           expense.status === 'pending' ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {expense.status}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredExpenses.length === 0 && (
                <div className="p-12 text-center">
                  <p className="text-gray-400 text-sm">No expenses found matching your criteria.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Section */}
        <div className="space-y-6">
          {/* Category Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Tag className="w-5 h-5 text-blue-600" />
              Category Breakdown
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.categoryBreakdown}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data?.categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Filter */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              Filter by Category
            </h2>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-medium transition-all",
                    filterCategory === cat 
                      ? "bg-blue-600 text-white" 
                      : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Record Expense</h2>
                <button onClick={() => setShowAddForm(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              <form onSubmit={handleAddExpense} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Expense Title</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Office Supplies"
                    value={newExpense.title}
                    onChange={(e) => setNewExpense({...newExpense, title: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Amount (₹)</label>
                    <input 
                      type="number" 
                      required
                      placeholder="0.00"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Category</label>
                    <select 
                      value={newExpense.category}
                      onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option>Utilities</option>
                      <option>Rent</option>
                      <option>Payroll</option>
                      <option>Marketing</option>
                      <option>Inventory</option>
                      <option>Maintenance</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Date</label>
                    <input 
                      type="date" 
                      required
                      value={newExpense.date}
                      onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Status</label>
                    <select 
                      value={newExpense.status}
                      onChange={(e) => setNewExpense({...newExpense, status: e.target.value as any})}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                      <option value="upcoming">Upcoming</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input 
                    type="checkbox" 
                    id="recurring"
                    checked={newExpense.recurring}
                    onChange={(e) => setNewExpense({...newExpense, recurring: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <label htmlFor="recurring" className="text-sm text-gray-600 font-medium">Recurring monthly expense</label>
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 mt-4"
                >
                  Save Expense
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
