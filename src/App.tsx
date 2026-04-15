import { useEffect, useState } from 'react';
import { 
  LayoutDashboard, TrendingUp, Package, Receipt, Wallet, RefreshCcw, 
  BarChart3, Boxes, PieChart, Trophy, ShoppingCart, Users, Store, 
  Globe, AlertTriangle, ArrowRight, Shield, History, UserCircle, LogOut,
  ChevronDown, Truck, ClipboardList, Building2, Camera
} from 'lucide-react';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { fetchDashboardData, getCurrentUser, fetchUsers, fetchRoles, switchUser, hasPermission } from './services/api';
import { DashboardData, User, Role, ModuleName } from './types';
import { KPICard } from './components/KPICard';
import { SalesTrendChart } from './components/SalesTrendChart';
import { SalesAnalytics } from './components/SalesAnalytics';
import { InventoryInsights } from './components/InventoryInsights';
import { ProfitLoss } from './components/ProfitLoss';
import { ExpenseTracker } from './components/ExpenseTracker';
import { NotificationCenter } from './components/NotificationCenter';
import { SalesForecasting } from './components/SalesForecasting';
import { TopPerformance } from './components/TopPerformance';
import { POS } from './components/POS';
import { CustomerManagement } from './components/CustomerManagement';
import { RoleManagement } from './components/RoleManagement';
import { UserManagement } from './components/UserManagement';
import { AuditLogViewer } from './components/AuditLogViewer';
import { SupplierManagement } from './components/SupplierManagement';
import { PurchaseOrderManagement } from './components/PurchaseOrderManagement';
import { BranchManagement } from './components/BranchManagement';
import { BarcodeScanner } from './components/BarcodeScanner';
import { Login } from './components/Login';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

type Tab = 'dashboard' | 'inventory' | 'expenses' | 'pos' | 'customers' | 'suppliers' | 'procurement';
type DashboardSubTab = 'overview' | 'analytics' | 'profit-loss' | 'forecasting' | 'performance' | 'users' | 'rbac' | 'audit' | 'branches';

export default function App() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [dashboardSubTab, setDashboardSubTab] = useState<DashboardSubTab>('overview');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [showUserSwitcher, setShowUserSwitcher] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthReady(true);
      if (user) {
        setIsAuthenticated(true);
        loadInitialData();
      } else {
        setIsAuthenticated(false);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboardResult, userResult, usersResult, rolesResult] = await Promise.all([
        fetchDashboardData(),
        getCurrentUser(),
        fetchUsers(),
        fetchRoles()
      ]);
      setData(dashboardResult);
      setCurrentUser(userResult);
      setAllUsers(usersResult);
      setRoles(rolesResult);
    } catch (err) {
      console.error("Failed to fetch initial data:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // loadInitialData is now called by the auth listener above
  }, []);

  const handleSwitchUser = async (userId: string) => {
    try {
      const newUser = await switchUser(userId);
      setCurrentUser(newUser);
      setShowUserSwitcher(false);
      // Reset to dashboard if current tab is not allowed
      setActiveTab('dashboard');
    } catch (error) {
      console.error("Failed to switch user:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  const handleBarcodeScan = (code: string) => {
    setLastScannedCode(code);
    // If we are in POS or Inventory, we could potentially trigger a search
    // For now, we'll just show a notification (handled by the notification center if we had a trigger)
    console.log("Scanned Barcode:", code);
    
    // Auto-navigate to relevant tab if it makes sense
    if (activeTab !== 'pos' && activeTab !== 'inventory') {
      setActiveTab('inventory');
    }
  };

  const canView = (module: string) => {
    if (!currentUser) return false;
    // Map consolidated modules to their original permission keys
    const permissionMap: Record<string, ModuleName> = {
      'reports': 'reports',
      'administration': 'rbac',
      'dashboard': 'dashboard',
      'pos': 'pos',
      'inventory': 'inventory',
      'orders': 'procurement',
      'customers': 'customers',
      'expenses': 'expenses',
      'suppliers': 'suppliers'
    };
    
    // For consolidated tabs, check if user has permission for any of the sub-modules
    if (module === 'dashboard') {
      return hasPermission(currentUser, 'dashboard', 'view') || 
             hasPermission(currentUser, 'reports', 'view') || 
             hasPermission(currentUser, 'profit-loss', 'view') || 
             hasPermission(currentUser, 'forecasting', 'view') || 
             hasPermission(currentUser, 'performance', 'view') ||
             hasPermission(currentUser, 'rbac', 'view') || 
             hasPermission(currentUser, 'users', 'view') || 
             hasPermission(currentUser, 'audit', 'view') || 
             hasPermission(currentUser, 'branches', 'view');
    }

    return hasPermission(currentUser, (permissionMap[module] || module) as ModuleName, 'view');
  };

  const getRoleName = (roleId: string) => {
    return roles.find(r => r.id === roleId)?.name || 'Unknown';
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Failed to Load Dashboard</h2>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
            <p className="text-xs font-mono text-slate-600 break-words">{error.message}</p>
          </div>
          <button 
            onClick={loadInitialData}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3"
          >
            <RefreshCcw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthReady || (loading && !data)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCcw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-gray-500 font-medium">Loading RetailCore...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={loadInitialData} />;
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] font-sans p-4 md:p-8" id="dashboard-root">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between mb-10 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                RetailCore
                <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full uppercase tracking-widest">v2.4</span>
              </h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Performance Intelligence</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 overflow-x-auto max-w-full scrollbar-none shadow-sm">
            {canView('dashboard') && (
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={cn(
                  "nav-tab",
                  activeTab === 'dashboard' && "nav-tab-active"
                )}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
            )}
            
            {canView('pos') && (
              <button 
                onClick={() => setActiveTab('pos')}
                className={cn(
                  "nav-tab",
                  activeTab === 'pos' && "nav-tab-active"
                )}
              >
                <ShoppingCart className="w-4 h-4" />
                POS
              </button>
            )}

            {canView('inventory') && (
              <button 
                onClick={() => setActiveTab('inventory')}
                className={cn(
                  "nav-tab",
                  activeTab === 'inventory' && "nav-tab-active"
                )}
              >
                <Package className="w-4 h-4" />
                Inventory
              </button>
            )}

            {canView('procurement') && (
              <button 
                onClick={() => setActiveTab('procurement')}
                className={cn(
                  "nav-tab",
                  activeTab === 'procurement' && "nav-tab-active"
                )}
              >
                <ClipboardList className="w-4 h-4" />
                Orders
              </button>
            )}

            {canView('customers') && (
              <button 
                onClick={() => setActiveTab('customers')}
                className={cn(
                  "nav-tab",
                  activeTab === 'customers' && "nav-tab-active"
                )}
              >
                <Users className="w-4 h-4" />
                Customers
              </button>
            )}

            {canView('expenses') && (
              <button 
                onClick={() => setActiveTab('expenses')}
                className={cn(
                  "nav-tab",
                  activeTab === 'expenses' && "nav-tab-active"
                )}
              >
                <Receipt className="w-4 h-4" />
                Expenses
              </button>
            )}

            {canView('suppliers') && (
              <button 
                onClick={() => setActiveTab('suppliers')}
                className={cn(
                  "nav-tab",
                  activeTab === 'suppliers' && "nav-tab-active"
                )}
              >
                <Truck className="w-4 h-4" />
                Suppliers
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowScanner(true)}
              className="p-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center gap-2"
              title="Scan Barcode"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-bold">Scan</span>
            </button>

            {canView('pos') && (
              <button 
                onClick={() => setActiveTab('pos')}
                className="btn-primary flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Launch POS
              </button>
            )}
            
            {/* User Switcher (Demo Only) */}
            <div className="relative">
              <button 
                onClick={() => setShowUserSwitcher(!showUserSwitcher)}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                  {currentUser?.name.charAt(0)}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-slate-900 leading-tight">{currentUser?.name}</p>
                  <p className="text-[10px] text-slate-500 leading-tight">{getRoleName(currentUser?.roleId || '')}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              <AnimatePresence>
                {showUserSwitcher && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Switch User (Demo)</p>
                    </div>
                    <div className="p-2 max-h-64 overflow-y-auto">
                      {allUsers.map(user => (
                        <button
                          key={user.id}
                          onClick={() => handleSwitchUser(user.id)}
                          className={cn(
                            "w-full flex items-center gap-3 p-2 rounded-xl transition-all hover:bg-slate-50",
                            currentUser?.id === user.id && "bg-slate-50"
                          )}
                        >
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                            {user.name.charAt(0)}
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold text-slate-900">{user.name}</p>
                            <p className="text-[10px] text-slate-500">{getRoleName(user.roleId)}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="p-2 border-t border-slate-50">
                      <button 
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all text-sm font-bold"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <NotificationCenter onNavigate={setActiveTab} />
            <button 
              onClick={loadInitialData}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCcw className={loading ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
              Refresh
            </button>
          </div>
        </header>

        <AnimatePresence>
          {showScanner && (
            <BarcodeScanner 
              onScan={handleBarcodeScan}
              onClose={() => setShowScanner(false)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                {/* Dashboard Sub-navigation */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 overflow-x-auto max-w-full scrollbar-none mb-8 shadow-sm">
                  <button 
                    onClick={() => setDashboardSubTab('overview')}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                      dashboardSubTab === 'overview' ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                    )}
                  >
                    Overview
                  </button>
                  <button 
                    onClick={() => setDashboardSubTab('analytics')}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                      dashboardSubTab === 'analytics' ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                    )}
                  >
                    Analytics
                  </button>
                  <button 
                    onClick={() => setDashboardSubTab('profit-loss')}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                      dashboardSubTab === 'profit-loss' ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                    )}
                  >
                    Profit & Loss
                  </button>
                  <button 
                    onClick={() => setDashboardSubTab('forecasting')}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                      dashboardSubTab === 'forecasting' ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                    )}
                  >
                    Forecasting
                  </button>
                  <button 
                    onClick={() => setDashboardSubTab('performance')}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                      dashboardSubTab === 'performance' ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                    )}
                  >
                    Performance
                  </button>
                  <div className="w-px h-4 bg-slate-200 mx-2" />
                  <button 
                    onClick={() => setDashboardSubTab('users')}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                      dashboardSubTab === 'users' ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                    )}
                  >
                    Users
                  </button>
                  <button 
                    onClick={() => setDashboardSubTab('rbac')}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                      dashboardSubTab === 'rbac' ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                    )}
                  >
                    Roles
                  </button>
                  <button 
                    onClick={() => setDashboardSubTab('audit')}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                      dashboardSubTab === 'audit' ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                    )}
                  >
                    Audit
                  </button>
                  <button 
                    onClick={() => setDashboardSubTab('branches')}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                      dashboardSubTab === 'branches' ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                    )}
                  >
                    Branches
                  </button>
                </div>

                {dashboardSubTab === 'overview' && (
                  <>
                    {/* KPI Grid */}
                    <div 
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
                      id="kpi-grid"
                    >
                      <KPICard data={data.todaySales} />
                      <KPICard data={data.netProfit} className="bg-emerald-50/50 border-emerald-100" />
                      <KPICard data={data.monthlySales} />
                      <KPICard data={data.monthlyExpenses} isExpense={true} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Secondary KPIs */}
                      <div 
                        className="flex flex-col gap-6"
                        id="secondary-kpis"
                      >
                        <KPICard data={data.inventoryValue} className="flex-1" />
                        <KPICard data={data.totalReceivables} isExpense={true} className="flex-1" />
                        <KPICard data={data.customerValue} className="flex-1 bg-slate-900 text-white border-none shadow-slate-200" />
                      </div>

                      {/* Main Chart */}
                      <div 
                        className="lg:col-span-2 space-y-6"
                        id="trend-chart-section"
                      >
                        <SalesTrendChart data={data.salesTrend} />
                        
                        {/* Sales Split & Alerts */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Sales Split */}
                          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="section-header">
                              <PieChart className="w-4 h-4 text-slate-500" />
                              Sales Split (Monthly)
                            </h3>
                            <div className="space-y-6">
                              <div>
                                <div className="flex justify-between items-end mb-2">
                                  <div className="flex items-center gap-2">
                                    <Store className="w-4 h-4 text-emerald-500" />
                                    <span className="text-sm font-bold text-slate-700">In-Store</span>
                                  </div>
                                  <span className="text-sm font-black text-slate-900">
                                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(data.salesSplit.inStore)}
                                  </span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(data.salesSplit.inStore / (data.salesSplit.inStore + data.salesSplit.online)) * 100}%` }}
                                    className="h-full bg-emerald-500"
                                  />
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between items-end mb-2">
                                  <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-slate-500" />
                                    <span className="text-sm font-bold text-slate-700">Online</span>
                                  </div>
                                  <span className="text-sm font-black text-slate-900">
                                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(data.salesSplit.online)}
                                  </span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(data.salesSplit.online / (data.salesSplit.inStore + data.salesSplit.online)) * 100}%` }}
                                    className="h-full bg-slate-900"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Active Alerts */}
                          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="section-header justify-between">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                Active Alerts
                              </div>
                              {data.alerts.length > 0 && (
                                <span className="bg-rose-100 text-rose-600 text-[10px] px-2 py-0.5 rounded-full">
                                  {data.alerts.length} New
                                </span>
                              )}
                            </h3>
                            <div className="space-y-3">
                              {data.alerts.length === 0 ? (
                                <div className="py-8 text-center text-slate-400 text-sm italic">
                                  No active alerts. Everything looks good!
                                </div>
                              ) : (
                                data.alerts.map(alert => (
                                  <button 
                                    key={alert.id}
                                    onClick={() => setActiveTab(alert.targetTab as Tab)}
                                    className="w-full text-left p-3 rounded-xl border border-slate-50 hover:border-slate-100 hover:bg-slate-50 transition-all group"
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className={cn(
                                        "p-1.5 rounded-lg mt-0.5",
                                        alert.severity === 'critical' ? "bg-rose-100 text-rose-600" :
                                        alert.severity === 'high' ? "bg-amber-100 text-amber-600" :
                                        "bg-slate-100 text-slate-600"
                                      )}>
                                        <AlertTriangle className="w-3 h-3" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-slate-900 truncate">{alert.title}</p>
                                        <p className="text-[10px] text-slate-500 truncate">{alert.message}</p>
                                      </div>
                                      <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-slate-900 transition-colors" />
                                    </div>
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {dashboardSubTab === 'analytics' && <SalesAnalytics />}
                {dashboardSubTab === 'profit-loss' && <ProfitLoss currentUser={currentUser} />}
                {dashboardSubTab === 'forecasting' && <SalesForecasting />}
                {dashboardSubTab === 'performance' && <TopPerformance />}
                {dashboardSubTab === 'users' && <UserManagement />}
                {dashboardSubTab === 'rbac' && <RoleManagement />}
                {dashboardSubTab === 'audit' && <AuditLogViewer />}
                {dashboardSubTab === 'branches' && <BranchManagement currentUser={currentUser} />}
              </div>
            )}

            {activeTab === 'pos' && (
              <POS onOrderComplete={loadInitialData} currentUser={currentUser} lastScannedCode={lastScannedCode} />
            )}

            {activeTab === 'inventory' && (
              <InventoryInsights onDataUpdate={loadInitialData} currentUser={currentUser} lastScannedCode={lastScannedCode} />
            )}

            {activeTab === 'procurement' && (
              <PurchaseOrderManagement currentUser={currentUser} />
            )}

            {activeTab === 'customers' && (
              <CustomerManagement currentUser={currentUser} />
            )}

            {activeTab === 'expenses' && (
              <ExpenseTracker currentUser={currentUser} />
            )}

            {activeTab === 'suppliers' && (
              <SupplierManagement currentUser={currentUser} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer Info */}
        <footer className="mt-12 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
          <p>© 2026 RetailCore. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1"><TrendingUp className="w-4 h-4" /> Growth Focused</span>
            <span className="flex items-center gap-1"><Package className="w-4 h-4" /> Inventory Optimized</span>
            <span className="flex items-center gap-1"><Wallet className="w-4 h-4" /> Expense Tracked</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
