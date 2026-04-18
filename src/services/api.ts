import { 
  DashboardData, SalesAnalyticsData, InventoryInsightsData, InventoryItem, 
  ProfitLossData, ExpenseData, Expense, DashboardAlert, ForecastData, 
  TopPerformanceData, StockEntry, Order, Customer, PaymentRecord,
  Role, User, AuditLog, ModuleName, ActionType, Branch, Supplier, PurchaseOrder,
  VendorBill, VendorPayment, VendorManagementData
} from "../types";
import { db, auth, handleFirestoreError, OperationType } from "../lib/firebase";
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc, 
  query, where, orderBy, limit, onSnapshot, Timestamp 
} from "firebase/firestore";

// Internal mock state to persist changes during session
let mockCustomers: Customer[] = [
  { id: 'c1', name: 'John Doe', phone: '9876543210', totalSpent: 1500, ordersCount: 5, outstandingBalance: 0, lastPurchaseDate: '2026-03-20', loyaltyPoints: 150, storeCredit: 0, orderHistory: [] },
  { id: 'c2', name: 'Jane Smith', phone: '9988776655', totalSpent: 2400, ordersCount: 8, outstandingBalance: 500, lastPurchaseDate: '2026-03-25', loyaltyPoints: 240, storeCredit: 50, orderHistory: [] }
];

let mockOrders: Order[] = [];
let mockInventory: InventoryItem[] = [
  { id: '1', name: 'Premium Wireless Headphones', sku: 'WH-1000XM4', quantity: 5, threshold: 10, purchasePrice: 150, sellingPrice: 299, gstPercent: 18, status: 'low-stock', branchId: 'b1' },
  { id: '2', name: 'Smart Watch Series 7', sku: 'SW-7-BLK', quantity: 0, threshold: 5, purchasePrice: 200, sellingPrice: 399, gstPercent: 18, status: 'out-of-stock', branchId: 'b1' },
  { id: '3', name: 'Ergonomic Office Chair', sku: 'CH-ERG-01', quantity: 15, threshold: 5, purchasePrice: 80, sellingPrice: 199, gstPercent: 12, status: 'in-stock', branchId: 'b1' },
  { id: '4', name: 'Organic Protein Powder', sku: 'PP-ORG-VAN', quantity: 20, threshold: 10, purchasePrice: 25, sellingPrice: 45, gstPercent: 5, expiryDate: '2026-04-15', status: 'expiring-soon', branchId: 'b1' },
  { id: '5', name: 'Mechanical Keyboard RGB', sku: 'KB-MECH-02', quantity: 3, threshold: 8, purchasePrice: 45, sellingPrice: 89, gstPercent: 18, status: 'low-stock', branchId: 'b1' },
  { id: '6', name: 'USB-C Fast Charger', sku: 'CH-USBC-30W', quantity: 50, threshold: 20, purchasePrice: 8, sellingPrice: 25, gstPercent: 12, status: 'in-stock', branchId: 'b2' },
  { id: '7', name: 'Laptop Pro 14-inch', sku: 'LP-PRO-14', quantity: 2, threshold: 5, purchasePrice: 1200, sellingPrice: 1999, gstPercent: 18, status: 'low-stock', branchId: 'b2' },
  { id: '8', name: 'Wireless Mouse', sku: 'MS-WL-01', quantity: 0, threshold: 10, purchasePrice: 15, sellingPrice: 35, gstPercent: 12, status: 'out-of-stock', branchId: 'b2' },
];

let mockStockLogs: StockEntry[] = [
  { id: 'log-1', productId: '1', productName: 'Premium Wireless Headphones', barcode: 'WH-1000XM4', purchasePrice: 150, sellingPrice: 299, gstPercent: 18, quantityAdded: 10, date: '2026-03-20T10:00:00Z', branchId: 'b1', actionType: 'STOCK_IN' },
  { id: 'log-2', productId: '3', productName: 'Ergonomic Office Chair', barcode: 'CH-ERG-01', purchasePrice: 80, sellingPrice: 199, gstPercent: 12, quantityAdded: 5, date: '2026-03-25T14:30:00Z', branchId: 'b1', actionType: 'STOCK_IN' },
];

let mockExpenses: Expense[] = [
  { id: '1', title: 'Monthly Store Rent', amount: 12000, category: 'Rent', date: '2026-03-01', branchId: 'b1', status: 'paid', recurring: true },
  { id: '2', title: 'Electricity Bill', amount: 2450, category: 'Utilities', date: '2026-03-15', branchId: 'b1', status: 'paid' },
  { id: '3', title: 'Staff Salaries', amount: 25000, category: 'Payroll', date: '2026-03-28', branchId: 'b1', status: 'pending', recurring: true },
  { id: '4', title: 'Internet & Phone', amount: 850, category: 'Utilities', date: '2026-03-05', branchId: 'b1', status: 'paid', recurring: true },
  { id: '5', title: 'Marketing Campaign', amount: 5000, category: 'Marketing', date: '2026-03-20', branchId: 'b1', status: 'paid' },
  { id: '6', title: 'Inventory Restock', amount: 15000, category: 'Inventory', date: '2026-04-02', branchId: 'b1', status: 'upcoming' },
  { id: '7', title: 'Maintenance & Repairs', amount: 1200, category: 'Maintenance', date: '2026-03-22', branchId: 'b1', status: 'paid' },
  { id: '8', title: 'Software Subscriptions', amount: 450, category: 'Software', date: '2026-04-05', branchId: 'b1', status: 'upcoming', recurring: true },
];

let mockRoles: Role[] = [
  {
    id: 'role-admin',
    name: 'Admin',
    description: 'Full system access',
    isSystem: true,
    permissions: [
      { module: 'dashboard', actions: ['view'] },
      { module: 'inventory', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'pos', actions: ['view', 'create'] },
      { module: 'orders', actions: ['view', 'edit', 'delete', 'approve'] },
      { module: 'customers', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'payments', actions: ['view', 'create', 'edit'] },
      { module: 'refunds', actions: ['view', 'create', 'approve'] },
      { module: 'expenses', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'reports', actions: ['view'] },
      { module: 'forecasting', actions: ['view'] },
      { module: 'performance', actions: ['view'] },
      { module: 'rbac', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'suppliers', actions: ['view', 'create', 'edit', 'delete'] },
    ]
  },
  {
    id: 'role-manager',
    name: 'Manager',
    description: 'Management access with some restrictions',
    permissions: [
      { module: 'dashboard', actions: ['view'] },
      { module: 'inventory', actions: ['view', 'create', 'edit'] },
      { module: 'pos', actions: ['view', 'create'] },
      { module: 'orders', actions: ['view', 'edit'] },
      { module: 'customers', actions: ['view', 'create', 'edit'] },
      { module: 'payments', actions: ['view', 'create'] },
      { module: 'refunds', actions: ['view', 'create'] },
      { module: 'expenses', actions: ['view', 'create'] },
      { module: 'reports', actions: ['view'] },
      { module: 'forecasting', actions: ['view'] },
      { module: 'performance', actions: ['view'] },
      { module: 'suppliers', actions: ['view', 'create', 'edit'] },
    ]
  },
  {
    id: 'role-cashier',
    name: 'Cashier',
    description: 'Point of Sale access only',
    permissions: [
      { module: 'pos', actions: ['view', 'create'] },
      { module: 'orders', actions: ['view'] },
      { module: 'customers', actions: ['view', 'create'] },
    ]
  },
  {
    id: 'role-inventory',
    name: 'Inventory Staff',
    description: 'Inventory management access',
    permissions: [
      { module: 'inventory', actions: ['view', 'create', 'edit'] },
    ]
  }
];

let mockBranches: Branch[] = [
  { id: 'b1', name: 'Main Store - Downtown', location: '123 Main St, City', phone: '555-0101', isActive: true },
  { id: 'b2', name: 'Westside Branch', location: '456 West Ave, City', phone: '555-0102', isActive: true }
];

let mockSuppliers: Supplier[] = [
  { id: 's1', name: 'Global Tech Solutions', contactPerson: 'Alice Smith', phone: '555-2020', email: 'alice@globaltech.com', address: '789 Tech Park, Silicon Valley', gstNumber: 'GST123456789', paymentTerms: 'Net 30', totalOwed: 25000, totalPaid: 150000 },
  { id: 's2', name: 'Office Essentials Ltd', contactPerson: 'Bob Johnson', phone: '555-3030', email: 'bob@officeessentials.com', address: '101 Stationery Way, City', gstNumber: 'GST987654321', paymentTerms: 'Net 15', totalOwed: 5400, totalPaid: 45000 }
];

let mockVendorBills: VendorBill[] = [
  { id: 'bill-1', vendorId: 's1', vendorName: 'Global Tech Solutions', billNumber: 'INV-2026-001', date: '2026-04-01', dueDate: '2026-04-30', items: [{ description: 'Laptop Keyboards', quantity: 20, unitPrice: 500, total: 10000 }], totalAmount: 10000, paidAmount: 0, balance: 10000, status: 'UNPAID', branchId: 'b1' },
  { id: 'bill-2', vendorId: 's1', vendorName: 'Global Tech Solutions', billNumber: 'INV-2026-005', date: '2026-04-10', dueDate: '2026-05-10', items: [{ description: 'Webcams 1080p', quantity: 15, unitPrice: 1000, total: 15000 }], totalAmount: 15000, paidAmount: 0, balance: 15000, status: 'UNPAID', branchId: 'b1' },
  { id: 'bill-3', vendorId: 's2', vendorName: 'Office Essentials Ltd', billNumber: 'OE-10293', date: '2026-04-05', dueDate: '2026-04-20', items: [{ description: 'Printer Paper A4', quantity: 100, unitPrice: 250, total: 25000 }], totalAmount: 25000, paidAmount: 19600, balance: 5400, status: 'PARTIALLY_PAID', branchId: 'b1' }
];

let mockVendorPayments: VendorPayment[] = [
  { id: 'vpay-1', billId: 'bill-3', vendorId: 's2', amount: 19600, date: '2026-04-15', paymentMethod: 'UPI', referenceNumber: 'TXN998877', note: 'Partial payment for paper stock' }
];

let mockPurchaseOrders: PurchaseOrder[] = [];

let mockUsers: User[] = [
  { id: 'u1', name: 'Admin User', email: 'admin@example.com', roleId: 'role-admin', branchId: 'b1', isActive: true },
  { id: 'u2', name: 'John Manager', email: 'john@example.com', roleId: 'role-manager', branchId: 'b1', isActive: true },
  { id: 'u3', name: 'Sarah Cashier', email: 'sarah@example.com', roleId: 'role-cashier', branchId: 'b1', isActive: true },
  { id: 'u4', name: 'Mike Inventory', email: 'mike@example.com', roleId: 'role-inventory', branchId: 'b1', isActive: true },
];

let mockAuditLogs: AuditLog[] = [
  { id: 'log-1', userId: 'u1', userName: 'Admin User', action: 'Created Role', module: 'rbac', details: 'Created Manager role', timestamp: '2026-03-28T10:00:00Z' },
  { id: 'log-2', userId: 'u2', userName: 'John Manager', action: 'Updated Stock', module: 'inventory', details: 'Updated Smart Watch Series 7 quantity', timestamp: '2026-03-29T09:00:00Z' },
];

let currentUser: User = mockUsers[0]; // Default to admin for demo

// Helper to update item status
const updateItemStatus = (item: InventoryItem): InventoryItem => {
  let status: InventoryItem['status'] = 'in-stock';
  if (item.quantity <= 0) {
    status = 'out-of-stock';
  } else if (item.quantity <= item.threshold) {
    status = 'low-stock';
  }
  
  // Expiry check
  if (item.expiryDate) {
    const expiry = new Date(item.expiryDate);
    const now = new Date();
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 30 && diffDays > 0) {
      status = 'expiring-soon';
    }
  }
  
  return { ...item, status };
};

// Mocking the APIs as requested
export const fetchDashboardData = async (): Promise<DashboardData> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  const isAdmin = currentUser.roleId === 'role-admin';
  const branchId = currentUser.branchId;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMonthStr = now.toISOString().slice(0, 7); // YYYY-MM

  // Filter data based on branch if not admin
  const filteredOrders = isAdmin ? mockOrders : mockOrders.filter(o => o.branchId === branchId);
  const filteredInventory = isAdmin ? mockInventory : mockInventory.filter(i => i.branchId === branchId);
  const filteredCustomers = mockCustomers; // Customers are global for now

  // Filter orders
  const todayOrders = filteredOrders.filter(o => o.date.startsWith(todayStr));
  const monthlyOrders = filteredOrders.filter(o => o.date.startsWith(currentMonthStr));

  // Calculate Sales & Profit (Revenue - COGS)
  const calculateSalesAndProfit = (orders: Order[]) => {
    let sales = 0;
    let profit = 0;
    orders.forEach(order => {
      sales += order.totalAmount;
      order.items.forEach(item => {
        profit += (item.sellingPrice - item.purchasePrice) * item.quantity;
      });
    });
    return { sales, profit };
  };

  const todayStats = calculateSalesAndProfit(todayOrders);
  const monthlyStats = calculateSalesAndProfit(monthlyOrders);

  // Inventory Value
  const totalInventoryValue = filteredInventory.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0);
  
  // Receivables
  const totalReceivables = filteredCustomers.reduce((sum, c) => sum + c.outstandingBalance, 0);
  
  // Customer Value
  const avgCustomerValue = filteredCustomers.length > 0 
    ? filteredCustomers.reduce((sum, c) => sum + c.totalSpent, 0) / filteredCustomers.length 
    : 0;

  // Sales Split
  const inStoreSales = monthlyOrders.filter(o => o.orderType === 'IN_STORE').reduce((sum, o) => sum + o.totalAmount, 0);
  const onlineSales = monthlyOrders.filter(o => o.orderType === 'ONLINE').reduce((sum, o) => sum + o.totalAmount, 0);

  // Expenses & Refunds
  const monthlyExpensesVal = mockExpenses
    .filter(e => e.date.startsWith(currentMonthStr) && e.status !== 'upcoming')
    .reduce((sum, e) => sum + e.amount, 0);
  const monthlyRefundsVal = 12500; // Still mocked as we don't have a refunds store yet

  const netProfitVal = monthlyStats.profit - monthlyExpensesVal - monthlyRefundsVal;

  // Dynamic Alerts
  const alerts: DashboardAlert[] = [];
  
  filteredInventory.forEach(item => {
    if (item.status === 'out-of-stock') {
      alerts.push({
        id: `alert-oos-${item.id}`,
        type: 'out-of-stock',
        title: `Out of Stock: ${item.name}`,
        message: `${item.name} (${item.sku}) is out of stock.`,
        severity: 'critical',
        timestamp: new Date().toISOString(),
        targetTab: 'inventory',
        isRead: false
      });
    } else if (item.status === 'low-stock') {
      alerts.push({
        id: `alert-low-${item.id}`,
        type: 'low-stock',
        title: `Low Stock: ${item.name}`,
        message: `${item.name} is below threshold (${item.quantity}/${item.threshold}).`,
        severity: 'high',
        timestamp: new Date().toISOString(),
        targetTab: 'inventory',
        isRead: false
      });
    } else if (item.status === 'expiring-soon') {
      alerts.push({
        id: `alert-exp-${item.id}`,
        type: 'expiring-soon',
        title: `Expiry Warning: ${item.name}`,
        message: `${item.name} is expiring soon.`,
        severity: 'medium',
        timestamp: new Date().toISOString(),
        targetTab: 'inventory',
        isRead: false
      });
    }
  });

  if (totalReceivables > 5000) {
    alerts.push({
      id: 'alert-receivables',
      type: 'high-refunds', // Reusing type or could add 'high-receivables'
      title: 'High Pending Payments',
      message: `Total receivables ($${totalReceivables.toLocaleString()}) have exceeded the $5,000 threshold.`,
      severity: 'high',
      timestamp: new Date().toISOString(),
      targetTab: 'customers',
      isRead: false
    });
  }

  return {
    todaySales: {
      label: "Today's Sales",
      value: todayStats.sales || 12450.50, // Fallback to mock if no real orders
      previousValue: 11200.00,
      unit: 'currency',
      trend: todayStats.sales >= 11200 ? 'up' : 'down'
    },
    todayProfit: {
      label: "Today's Profit",
      value: todayStats.profit || 3735.15,
      previousValue: 3100.00,
      unit: 'currency',
      trend: todayStats.profit >= 3100 ? 'up' : 'down'
    },
    monthlySales: {
      label: "Monthly Sales",
      value: monthlyStats.sales || 342000.00,
      previousValue: 315000.00,
      unit: 'currency',
      trend: monthlyStats.sales >= 315000 ? 'up' : 'down'
    },
    monthlyProfit: {
      label: "Monthly Profit",
      value: monthlyStats.profit || 102600.00,
      previousValue: 98000.00,
      unit: 'currency',
      trend: monthlyStats.profit >= 98000 ? 'up' : 'down'
    },
    inventoryValue: {
      label: "Total Inventory Value",
      value: totalInventoryValue,
      previousValue: 845000.00,
      unit: 'currency',
      trend: totalInventoryValue >= 845000 ? 'up' : 'down'
    },
    monthlyExpenses: {
      label: "Total Expenses (Month)",
      value: monthlyExpensesVal,
      previousValue: 48000.00,
      unit: 'currency',
      trend: 'down'
    },
    netProfit: {
      label: "Net Profit",
      value: netProfitVal,
      previousValue: 50000.00,
      unit: 'currency',
      trend: netProfitVal >= 50000 ? 'up' : 'down'
    },
    totalReceivables: {
      label: "Total Receivables",
      value: totalReceivables,
      previousValue: totalReceivables * 0.95,
      unit: 'currency',
      trend: 'up'
    },
    customerValue: {
      label: "Avg. Customer Value",
      value: avgCustomerValue,
      previousValue: avgCustomerValue * 0.98,
      unit: 'currency',
      trend: 'up'
    },
    salesTrend: [
      { date: 'Mar 21', sales: 10200 },
      { date: 'Mar 22', sales: 11500 },
      { date: 'Mar 23', sales: 9800 },
      { date: 'Mar 24', sales: 12100 },
      { date: 'Mar 25', sales: 13400 },
      { date: 'Mar 26', sales: 11200 },
      { date: 'Mar 27', sales: 12450 },
    ],
    salesSplit: {
      inStore: inStoreSales || 120000,
      online: onlineSales || 222000
    },
    alerts: alerts.slice(0, 5) // Top 5 alerts
  };
};

export const fetchSalesAnalyticsData = async (): Promise<SalesAnalyticsData> => {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const isAdmin = currentUser.roleId === 'role-admin';
  const branchId = currentUser.branchId;
  const filteredOrders = isAdmin ? mockOrders : mockOrders.filter(o => o.branchId === branchId);

  const totalSales = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  return {
    dailySales: [
      { date: 'Mar 21', sales: 10200 },
      { date: 'Mar 22', sales: 11500 },
      { date: 'Mar 23', sales: 9800 },
      { date: 'Mar 24', sales: 12100 },
      { date: 'Mar 25', sales: 13400 },
      { date: 'Mar 26', sales: 11200 },
      { date: 'Mar 27', sales: 12450 },
    ],
    monthlySales: [
      { month: 'Apr 25', sales: 280000 },
      { month: 'May 25', sales: 295000 },
      { month: 'Jun 25', sales: 310000 },
      { month: 'Jul 25', sales: 305000 },
      { month: 'Aug 25', sales: 320000 },
      { month: 'Sep 25', sales: 335000 },
      { month: 'Oct 25', sales: 350000 },
      { month: 'Nov 25', sales: 410000 },
      { month: 'Dec 25', sales: 480000 },
      { month: 'Jan 26', sales: 320000 },
      { month: 'Feb 26', sales: 315000 },
      { month: 'Mar 26', sales: 342000 },
    ],
    yearlySales: [
      { year: '2023', sales: 3200000 },
      { year: '2024', sales: 3850000 },
      { year: '2025', sales: 4200000 },
    ],
    channelBreakdown: [
      { name: 'Online', value: 65 },
      { name: 'In-store', value: 35 },
    ],
    paymentBreakdown: [
      { name: 'UPI', value: 45 },
      { name: 'COD', value: 30 },
      { name: 'Cash', value: 25 },
    ]
  };
};

export const fetchInventoryInsightsData = async (): Promise<InventoryInsightsData> => {
  try {
    const snapshot = await getDocs(collection(db, 'inventory'));
    const allInventory = snapshot.docs.map(doc => doc.data() as InventoryItem);
    
    const lowStockItems = allInventory.filter(item => item.status === 'low-stock');
    const outOfStockItems = allInventory.filter(item => item.status === 'out-of-stock');
    const expiringSoonItems = allInventory.filter(item => item.status === 'expiring-soon');

    const totalStockValue = allInventory.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0);
    const potentialRevenue = allInventory.reduce((sum, item) => sum + (item.quantity * item.sellingPrice), 0);

    return {
      totalStockValue,
      potentialRevenue,
      lowStockItems,
      outOfStockItems,
      expiringSoonItems,
      allInventory,
      stockLogs: mockStockLogs // Keep logs mock for now
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'inventory');
    throw error;
  }
};

export const addStockEntry = async (entry: Omit<StockEntry, 'id' | 'date' | 'actionType'>): Promise<StockEntry> => {
  try {
    const newEntry: StockEntry = {
      ...entry,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      branchId: currentUser.branchId,
      actionType: 'STOCK_IN'
    };

    // Update Firestore Inventory
    if (entry.productId === 'new' || !entry.productId) {
      // Create new product
      const newProductId = `p${Math.random().toString(36).substr(2, 9)}`;
      const newItem: InventoryItem = {
        id: newProductId,
        name: entry.productName,
        sku: entry.barcode,
        quantity: entry.quantityAdded,
        threshold: 10,
        purchasePrice: entry.purchasePrice,
        sellingPrice: entry.sellingPrice,
        gstPercent: entry.gstPercent,
        expiryDate: entry.expiryDate,
        branchId: currentUser.branchId,
        status: 'in-stock',
        images: entry.images || []
      };
      
      const updatedItem = updateItemStatus(newItem);
      await setDoc(doc(db, 'inventory', newProductId), updatedItem);
      newEntry.productId = newProductId;
    } else {
      // Update existing item
      const itemRef = doc(db, 'inventory', entry.productId);
      const itemSnap = await getDoc(itemRef);
      if (itemSnap.exists()) {
        const currentItem = itemSnap.data() as InventoryItem;
        const updatedItem = updateItemStatus({
          ...currentItem,
          quantity: currentItem.quantity + entry.quantityAdded,
          purchasePrice: entry.purchasePrice,
          sellingPrice: entry.sellingPrice,
          gstPercent: entry.gstPercent,
          images: entry.images ? [...(entry.images)] : (currentItem.images || [])
        });
        // Limit to 4 images
        if (updatedItem.images) {
          updatedItem.images = updatedItem.images.slice(0, 4);
        }
        await setDoc(itemRef, updatedItem);
      }
    }

    // Record log in Firestore
    const logId = Math.random().toString(36).substr(2, 9);
    const logEntry: StockEntry = {
      id: logId,
      productId: newEntry.productId,
      productName: newEntry.productName,
      barcode: newEntry.barcode,
      purchasePrice: newEntry.purchasePrice,
      sellingPrice: newEntry.sellingPrice,
      gstPercent: newEntry.gstPercent,
      quantityAdded: entry.quantityAdded,
      date: newEntry.date,
      branchId: newEntry.branchId,
      actionType: 'STOCK_IN',
      images: entry.images
    };
    await setDoc(doc(db, 'stock_logs', logId), logEntry);

    mockStockLogs.push(newEntry);
    await addAuditLog('Stock Entry', 'inventory', `Added ${entry.quantityAdded} units to ${entry.productName}`);
    return newEntry;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'inventory');
    throw error;
  }
};

export const bulkImportInventory = async (items: Omit<InventoryItem, 'id' | 'status'>[]): Promise<void> => {
  try {
    await Promise.all(items.map(async (item) => {
      const id = `p${Math.random().toString(36).substr(2, 9)}`;
      const newItem = updateItemStatus({
        ...item,
        id,
        status: 'in-stock',
        images: item.images || []
      });
      await setDoc(doc(db, 'inventory', id), newItem);
    }));
    await addAuditLog('Bulk Import', 'inventory', `Imported ${items.length} items`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'inventory');
    throw error;
  }
};

export const updateInventoryItem = async (item: InventoryItem): Promise<InventoryItem> => {
  try {
    const updatedItem = updateItemStatus(item);
    await setDoc(doc(db, 'inventory', item.id), updatedItem);
    await addAuditLog('Update Product', 'inventory', `Updated productDetails for ${item.name}`);
    return updatedItem;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'inventory');
    throw error;
  }
};

export const fetchProductStockLogs = async (productId: string): Promise<StockEntry[]> => {
  try {
    const q = query(
      collection(db, 'stock_logs'),
      where('productId', '==', productId),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as StockEntry);
  } catch (error) {
    // If collection doesn't exist yet, return mock filtered or empty
    console.warn("Firestore logs not available yet, using mock", error);
    return mockStockLogs.filter(log => log.productId === productId).sort((a, b) => b.date.localeCompare(a.date));
  }
};

export const recordStockAdjustment = async (
  productId: string, 
  quantity: number, 
  type: 'RETURN' | 'LOSS_DAMAGED' | 'LOSS_EXPIRED'
): Promise<StockEntry> => {
  try {
    const itemRef = doc(db, 'inventory', productId);
    const itemSnap = await getDoc(itemRef);
    if (!itemSnap.exists()) throw new Error('Product not found');
    
    const item = itemSnap.data() as InventoryItem;
    
    const newEntry: StockEntry = {
      id: Math.random().toString(36).substr(2, 9),
      productId: item.id,
      productName: item.name,
      barcode: item.sku,
      purchasePrice: item.purchasePrice,
      sellingPrice: item.sellingPrice,
      gstPercent: item.gstPercent,
      quantityAdded: type === 'RETURN' ? quantity : -quantity,
      date: new Date().toISOString(),
      branchId: currentUser.branchId,
      actionType: type
    };

    // Update Product in Firestore
    const updatedItem = updateItemStatus({
      ...item,
      quantity: item.quantity + newEntry.quantityAdded
    });
    await setDoc(itemRef, updatedItem);

    // Record log in Firestore
    await setDoc(doc(db, 'stock_logs', newEntry.id), newEntry);
    
    // Fallback for mock state
    mockStockLogs.push(newEntry);

    return newEntry;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'inventory');
    throw error;
  }
};

export const createOrder = async (order: Omit<Order, 'id' | 'date'>): Promise<Order> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  const newOrder: Order = {
    ...order,
    id: `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    date: new Date().toISOString(),
    branchId: order.branchId || currentUser.branchId // Use current user's branch if not specified
  };

  mockOrders.push(newOrder);

  // Update inventory stock
  order.items.forEach(item => {
    const itemIndex = mockInventory.findIndex(i => i.id === item.productId);
    if (itemIndex !== -1) {
      const inventoryItem = mockInventory[itemIndex];
      mockInventory[itemIndex] = updateItemStatus({
        ...inventoryItem,
        quantity: inventoryItem.quantity - item.quantity
      });

      // Add stock log for sale
      mockStockLogs.push({
        id: Math.random().toString(36).substr(2, 9),
        productId: item.productId,
        productName: item.productName,
        barcode: item.sku,
        purchasePrice: item.purchasePrice,
        sellingPrice: item.sellingPrice,
        gstPercent: item.gstPercent,
        quantityAdded: -item.quantity,
        date: newOrder.date,
        branchId: newOrder.branchId,
        actionType: 'SALE'
      });
    }
  });

  // Update customer stats if customer is present
  if (order.customer) {
    const customerIndex = mockCustomers.findIndex(c => c.id === order.customer?.id);
    if (customerIndex !== -1) {
      const customer = mockCustomers[customerIndex];
      
      // Calculate loyalty points earned (1 point per 100 units)
      const pointsEarned = Math.floor(order.totalAmount / 100);
      
      // If points were used as payment, deduct them
      let pointsToDeduct = 0;
      if (order.paymentMethod === 'POINTS') {
        pointsToDeduct = order.amountPaid * 10; // Assume 1 point = 0.1 currency unit
      }

      // If store credit was used, deduct it
      let creditToDeduct = 0;
      if (order.paymentMethod === 'STORE_CREDIT') {
        creditToDeduct = order.amountPaid;
      }

      mockCustomers[customerIndex] = {
        ...customer,
        totalSpent: customer.totalSpent + order.totalAmount,
        ordersCount: customer.ordersCount + 1,
        lastPurchaseDate: newOrder.date,
        outstandingBalance: customer.outstandingBalance + order.balanceDue,
        loyaltyPoints: Math.max(0, customer.loyaltyPoints + pointsEarned - pointsToDeduct),
        storeCredit: Math.max(0, customer.storeCredit - creditToDeduct),
        orderHistory: [newOrder, ...(customer.orderHistory || [])]
      };
    }
  }

  await addAuditLog('Created Order', 'pos', `Order created: ${newOrder.id} for ${newOrder.totalAmount}`);
  return newOrder;
};

export const searchCustomer = async (phone: string): Promise<Customer | null> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return mockCustomers.find(c => c.phone === phone) || null;
};

export const createCustomer = async (customer: Omit<Customer, 'id' | 'totalSpent' | 'ordersCount' | 'outstandingBalance' | 'loyaltyPoints' | 'storeCredit'>): Promise<Customer> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const newCustomer: Customer = {
    ...customer,
    id: `CUST-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    totalSpent: 0,
    ordersCount: 0,
    outstandingBalance: 0,
    loyaltyPoints: 0,
    storeCredit: 0,
    orderHistory: []
  };
  mockCustomers.push(newCustomer);
  return newCustomer;
};

export const fetchCustomers = async (): Promise<Customer[]> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return [...mockCustomers].sort((a, b) => b.totalSpent - a.totalSpent);
};

export const recordPayment = async (orderId: string, payment: Omit<PaymentRecord, 'id' | 'date'>): Promise<Order> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const orderIndex = mockOrders.findIndex(o => o.id === orderId);
  if (orderIndex === -1) throw new Error('Order not found');

  const order = mockOrders[orderIndex];
  const newPayment: PaymentRecord = {
    ...payment,
    id: Math.random().toString(36).substr(2, 9),
    date: new Date().toISOString()
  };

  const newAmountPaid = order.amountPaid + payment.amount;
  const newBalanceDue = Math.max(0, order.totalAmount - newAmountPaid);
  const newStatus = newBalanceDue === 0 ? 'PAID' : 'PARTIALLY_PAID';

  const updatedOrder: Order = {
    ...order,
    amountPaid: newAmountPaid,
    balanceDue: newBalanceDue,
    paymentStatus: newStatus,
    paymentHistory: [...(order.paymentHistory || []), newPayment]
  };

  mockOrders[orderIndex] = updatedOrder;

  // Update customer balance and loyalty/credit if applicable
  if (order.customer) {
    const customerIndex = mockCustomers.findIndex(c => c.id === order.customer?.id);
    if (customerIndex !== -1) {
      const customer = mockCustomers[customerIndex];
      
      let creditDeduction = 0;
      let pointsDeduction = 0;
      
      if (payment.method === 'CARD' || payment.method === 'CASH' || payment.method === 'UPI') {
        // Normal payment reduces outstanding balance
        mockCustomers[customerIndex].outstandingBalance -= payment.amount;
      }
      // Note: If we added STORE_CREDIT or POINTS to PaymentRecord method, we'd handle it here.
      // For now, assume recordPayment is for external payments.
    }
  }

  await addAuditLog('Recorded Payment', 'payments', `Payment of ${payment.amount} for order ${orderId}`);
  return updatedOrder;
};

export const refundOrder = async (orderId: string): Promise<Order> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  const orderIndex = mockOrders.findIndex(o => o.id === orderId);
  if (orderIndex === -1) throw new Error('Order not found');

  const order = mockOrders[orderIndex];
  if (order.paymentStatus === 'UNPAID' && order.amountPaid === 0) {
    // Just cancel it? Or mark as refunded.
  }

  const updatedOrder: Order = {
    ...order,
    paymentStatus: 'UNPAID', // Or add a 'REFUNDED' status if we want to extend types
    amountPaid: 0,
    balanceDue: 0, // It's refunded, so no balance due
  };

  mockOrders[orderIndex] = updatedOrder;

  // Return items to stock
  order.items.forEach(item => {
    const itemIndex = mockInventory.findIndex(i => i.id === item.productId);
    if (itemIndex !== -1) {
      const inventoryItem = mockInventory[itemIndex];
      mockInventory[itemIndex] = updateItemStatus({
        ...inventoryItem,
        quantity: inventoryItem.quantity + item.quantity
      });

      // Add stock log for return
      mockStockLogs.push({
        id: Math.random().toString(36).substr(2, 9),
        productId: item.productId,
        productName: item.productName,
        barcode: item.sku,
        purchasePrice: item.purchasePrice,
        sellingPrice: item.sellingPrice,
        gstPercent: item.gstPercent,
        quantityAdded: item.quantity,
        date: new Date().toISOString(),
        branchId: order.branchId,
        actionType: 'RETURN'
      });
    }
  });

  // Update customer stats
  if (order.customer) {
    const customerIndex = mockCustomers.findIndex(c => c.id === order.customer?.id);
    if (customerIndex !== -1) {
      const customer = mockCustomers[customerIndex];
      mockCustomers[customerIndex] = {
        ...customer,
        totalSpent: Math.max(0, customer.totalSpent - order.totalAmount),
        ordersCount: Math.max(0, customer.ordersCount - 1),
        outstandingBalance: Math.max(0, customer.outstandingBalance - order.balanceDue)
      };
    }
  }

  return updatedOrder;
};

export const fetchProfitLossData = async (): Promise<ProfitLossData> => {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const isAdmin = currentUser.roleId === 'role-admin';
  const branchId = currentUser.branchId;
  const filteredOrders = isAdmin ? mockOrders : mockOrders.filter(o => o.branchId === branchId);
  const filteredExpenses = isAdmin ? mockExpenses : mockExpenses.filter(e => e.branchId === branchId);

  const now = new Date();
  const currentMonthStr = now.toISOString().slice(0, 7);
  const monthlyOrders = filteredOrders.filter(o => o.date.startsWith(currentMonthStr));

  let totalRevenue = 0;
  let cogs = 0;
  monthlyOrders.forEach(order => {
    totalRevenue += order.totalAmount;
    order.items.forEach(item => {
      cogs += item.purchasePrice * item.quantity;
    });
  });

  const expenses = filteredExpenses
    .filter(e => e.date.startsWith(currentMonthStr) && e.status !== 'upcoming')
    .reduce((sum, e) => sum + e.amount, 0);
  const refunds = 12500; // Mocked for now
  const netProfit = totalRevenue - cogs - expenses - refunds;

  return {
    totalRevenue: totalRevenue || 342000,
    cogs: cogs || 239400,
    expenses: expenses || 45200,
    refunds,
    netProfit: netProfit || 44900,
    dailyTrend: [
      { period: 'Mar 21', revenue: 10200, profit: 1500 },
      { period: 'Mar 22', revenue: 11500, profit: 1800 },
      { period: 'Mar 23', revenue: 9800, profit: 1200 },
      { period: 'Mar 24', revenue: 12100, profit: 2100 },
      { period: 'Mar 25', revenue: 13400, profit: 2400 },
      { period: 'Mar 26', revenue: 11200, profit: 1600 },
      { period: 'Mar 27', revenue: 12450, profit: 1900 },
    ],
    monthlyTrend: [
      { period: 'Oct 25', revenue: 350000, profit: 45000 },
      { period: 'Nov 25', revenue: 410000, profit: 58000 },
      { period: 'Dec 25', revenue: 480000, profit: 72000 },
      { period: 'Jan 26', revenue: 320000, profit: 38000 },
      { period: 'Feb 26', revenue: 315000, profit: 36000 },
      { period: 'Mar 26', revenue: totalRevenue || 342000, profit: netProfit || 44900 },
    ]
  };
};

export const fetchExpenseData = async (): Promise<ExpenseData> => {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const isAdmin = currentUser.roleId === 'role-admin';
  const branchId = currentUser.branchId;
  const filteredExpenses = isAdmin ? mockExpenses : mockExpenses.filter(e => e.branchId === branchId);

  const categoryBreakdown = [
    { name: 'Payroll', value: filteredExpenses.filter(e => e.category === 'Payroll').reduce((sum, e) => sum + e.amount, 0), color: '#3B82F6' },
    { name: 'Rent', value: filteredExpenses.filter(e => e.category === 'Rent').reduce((sum, e) => sum + e.amount, 0), color: '#10B981' },
    { name: 'Inventory', value: filteredExpenses.filter(e => e.category === 'Inventory').reduce((sum, e) => sum + e.amount, 0), color: '#F59E0B' },
    { name: 'Marketing', value: filteredExpenses.filter(e => e.category === 'Marketing').reduce((sum, e) => sum + e.amount, 0), color: '#EF4444' },
    { name: 'Utilities', value: filteredExpenses.filter(e => e.category === 'Utilities').reduce((sum, e) => sum + e.amount, 0), color: '#8B5CF6' },
    { name: 'Other', value: filteredExpenses.filter(e => !['Payroll', 'Rent', 'Inventory', 'Marketing', 'Utilities'].includes(e.category)).reduce((sum, e) => sum + e.amount, 0), color: '#6B7280' },
  ];

  const monthlyTotal = filteredExpenses
    .filter(e => e.date.startsWith('2026-03') && e.status !== 'upcoming')
    .reduce((sum, e) => sum + e.amount, 0);

  const upcomingTotal = filteredExpenses
    .filter(e => e.status === 'upcoming' || e.status === 'pending')
    .reduce((sum, e) => sum + e.amount, 0);

  return {
    monthlyTotal,
    upcomingTotal,
    expenses: filteredExpenses,
    categoryBreakdown
  };
};

export const addExpense = async (expense: Omit<Expense, 'id'>): Promise<Expense> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const newExpense: Expense = {
    ...expense,
    id: Math.random().toString(36).substr(2, 9),
    branchId: expense.branchId || currentUser.branchId
  };
  mockExpenses.push(newExpense);
  return newExpense;
};

export const fetchDashboardAlerts = async (): Promise<DashboardAlert[]> => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const isAdmin = currentUser.roleId === 'role-admin';
  const branchId = currentUser.branchId;
  const filteredInventory = isAdmin ? mockInventory : mockInventory.filter(i => i.branchId === branchId);
  const filteredCustomers = mockCustomers; // Customers are global for now

  const alerts: DashboardAlert[] = [];
  
  filteredInventory.forEach(item => {
    if (item.status === 'out-of-stock') {
      alerts.push({
        id: `alert-oos-${item.id}`,
        type: 'out-of-stock',
        title: `Out of Stock: ${item.name}`,
        message: `${item.name} (${item.sku}) is out of stock. Immediate reorder recommended.`,
        severity: 'critical',
        timestamp: new Date().toISOString(),
        targetTab: 'inventory',
        isRead: false
      });
    } else if (item.status === 'low-stock') {
      alerts.push({
        id: `alert-low-${item.id}`,
        type: 'low-stock',
        title: `Low Stock: ${item.name}`,
        message: `${item.name} is below threshold (${item.quantity}/${item.threshold}).`,
        severity: 'high',
        timestamp: new Date().toISOString(),
        targetTab: 'inventory',
        isRead: false
      });
    } else if (item.status === 'expiring-soon') {
      alerts.push({
        id: `alert-exp-${item.id}`,
        type: 'expiring-soon',
        title: `Expiry Warning: ${item.name}`,
        message: `${item.name} expires soon. Check batch details.`,
        severity: 'medium',
        timestamp: new Date().toISOString(),
        targetTab: 'inventory',
        isRead: false
      });
    }
  });

  const totalReceivables = filteredCustomers.reduce((sum, c) => sum + c.outstandingBalance, 0);
  if (totalReceivables > 5000) {
    alerts.push({
      id: 'alert-receivables',
      type: 'high-refunds',
      title: 'High Pending Payments',
      message: `Total receivables ($${totalReceivables.toLocaleString()}) have exceeded the $5,000 threshold.`,
      severity: 'high',
      timestamp: new Date().toISOString(),
      targetTab: 'customers',
      isRead: false
    });
  }

  // Add some static ones if list is too short for demo purposes
  if (alerts.length < 3) {
    alerts.push({
      id: 'static-1',
      type: 'high-refunds',
      title: 'Financial Alert: High Refunds',
      message: 'Refunds this month ($12,500) are 15% higher than average.',
      severity: 'medium',
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      targetTab: 'profit-loss',
      isRead: false
    });
  }

  return alerts.sort((a, b) => b.severity === 'critical' ? 1 : -1);
};

export const fetchForecastData = async (): Promise<ForecastData> => {
  await new Promise((resolve) => setTimeout(resolve, 800));

  return {
    expectedMonthlySales: 385000,
    expectedMonthlyProfit: 52000,
    growthRate: 12.5,
    confidenceScore: 88,
    projectionTrend: [
      { period: 'Jan 26', actualSales: 320000, actualProfit: 38000 },
      { period: 'Feb 26', actualSales: 315000, actualProfit: 36000 },
      { period: 'Mar 26', actualSales: 342000, actualProfit: 44900 },
      { period: 'Apr 26 (F)', forecastSales: 365000, forecastProfit: 48000 },
      { period: 'May 26 (F)', forecastSales: 385000, forecastProfit: 52000 },
      { period: 'Jun 26 (F)', forecastSales: 410000, forecastProfit: 58000 },
    ]
  };
};

export const fetchTopPerformanceData = async (): Promise<TopPerformanceData> => {
  await new Promise((resolve) => setTimeout(resolve, 600));

  return {
    topSelling: [
      { id: '1', name: 'Wireless Mouse', sku: 'MS-WL-01', category: 'Electronics', salesCount: 1250, revenue: 31250, profit: 12500, margin: 40, trend: 'up' },
      { id: '2', name: 'USB-C Cable', sku: 'CB-UC-02', category: 'Accessories', salesCount: 980, revenue: 14700, profit: 8820, margin: 60, trend: 'stable' },
      { id: '3', name: 'Smart Watch Series 7', sku: 'SW-7-BLK', category: 'Electronics', salesCount: 450, revenue: 135000, profit: 40500, margin: 30, trend: 'up' },
      { id: '4', name: 'Leather Wallet', sku: 'WL-LTH-BN', category: 'Fashion', salesCount: 320, revenue: 16000, profit: 9600, margin: 60, trend: 'down' },
      { id: '5', name: 'Bluetooth Earbuds', sku: 'EB-BT-WH', category: 'Electronics', salesCount: 280, revenue: 22400, profit: 8960, margin: 40, trend: 'up' },
    ],
    mostProfitable: [
      { id: '3', name: 'Smart Watch Series 7', sku: 'SW-7-BLK', category: 'Electronics', salesCount: 450, revenue: 135000, profit: 40500, margin: 30, trend: 'up' },
      { id: '1', name: 'Wireless Mouse', sku: 'MS-WL-01', category: 'Electronics', salesCount: 1250, revenue: 31250, profit: 12500, margin: 40, trend: 'up' },
      { id: '6', name: 'Ergonomic Chair', sku: 'CH-ERG-01', category: 'Furniture', salesCount: 45, revenue: 22500, profit: 11250, margin: 50, trend: 'stable' },
      { id: '4', name: 'Leather Wallet', sku: 'WL-LTH-BN', category: 'Fashion', salesCount: 320, revenue: 16000, profit: 9600, margin: 60, trend: 'down' },
      { id: '2', name: 'USB-C Cable', sku: 'CB-UC-02', category: 'Accessories', salesCount: 980, revenue: 14700, profit: 8820, margin: 60, trend: 'stable' },
    ],
    worstPerforming: [
      { id: '7', name: 'Old Model Keyboard', sku: 'KB-OLD-01', category: 'Electronics', salesCount: 5, revenue: 250, profit: -50, margin: -20, trend: 'down' },
      { id: '8', name: 'Generic Phone Case', sku: 'PC-GEN-01', category: 'Accessories', salesCount: 12, revenue: 120, profit: 12, margin: 10, trend: 'down' },
      { id: '9', name: 'Basic Desk Lamp', sku: 'LP-BSC-01', category: 'Home', salesCount: 8, revenue: 240, profit: 48, margin: 20, trend: 'stable' },
      { id: '10', name: 'Wired Earphones', sku: 'EP-WD-01', category: 'Accessories', salesCount: 15, revenue: 150, profit: 30, margin: 20, trend: 'down' },
      { id: '11', name: 'Screen Protector', sku: 'SP-GLS-01', category: 'Accessories', salesCount: 20, revenue: 200, profit: 100, margin: 50, trend: 'down' },
    ]
  };
};

// RBAC APIs
export const ROLE_TEMPLATES: Record<string, Partial<Role>> = {
  'admin': {
    name: 'Admin',
    description: 'Full system access',
    permissions: [
      { module: 'dashboard', actions: ['view'] },
      { module: 'inventory', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'pos', actions: ['view', 'create'] },
      { module: 'orders', actions: ['view', 'edit', 'delete', 'approve'] },
      { module: 'customers', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'payments', actions: ['view', 'create', 'edit'] },
      { module: 'refunds', actions: ['view', 'create', 'approve'] },
      { module: 'expenses', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'reports', actions: ['view'] },
      { module: 'forecasting', actions: ['view'] },
      { module: 'performance', actions: ['view'] },
      { module: 'rbac', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'suppliers', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'procurement', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
      { module: 'branches', actions: ['view', 'create', 'edit', 'delete'] },
    ]
  },
  'manager': {
    name: 'Manager',
    description: 'Management access for a specific branch',
    permissions: [
      { module: 'dashboard', actions: ['view'] },
      { module: 'inventory', actions: ['view', 'create', 'edit'] },
      { module: 'pos', actions: ['view', 'create'] },
      { module: 'orders', actions: ['view', 'edit'] },
      { module: 'customers', actions: ['view', 'create', 'edit'] },
      { module: 'payments', actions: ['view', 'create'] },
      { module: 'refunds', actions: ['view', 'create'] },
      { module: 'expenses', actions: ['view', 'create'] },
      { module: 'reports', actions: ['view'] },
      { module: 'suppliers', actions: ['view', 'create'] },
      { module: 'procurement', actions: ['view', 'create', 'edit'] },
    ]
  },
  'cashier': {
    name: 'Cashier',
    description: 'Point of Sale access only',
    permissions: [
      { module: 'pos', actions: ['view', 'create'] },
      { module: 'orders', actions: ['view'] },
      { module: 'customers', actions: ['view', 'create'] },
    ]
  },
  'inventory': {
    name: 'Inventory Staff',
    description: 'Inventory management access',
    permissions: [
      { module: 'inventory', actions: ['view', 'create', 'edit'] },
      { module: 'suppliers', actions: ['view'] },
      { module: 'procurement', actions: ['view', 'create'] },
    ]
  }
};

export const fetchRoles = async (): Promise<Role[]> => {
  // Roles can stay mock for now or be moved to Firestore
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockRoles;
};

export const createRole = async (role: Omit<Role, 'id'>): Promise<Role> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const newRole: Role = {
    ...role,
    id: `role-${Math.random().toString(36).substr(2, 9)}`
  };
  mockRoles.push(newRole);
  await addAuditLog('Created Role', 'rbac', `Created role: ${newRole.name}`);
  return newRole;
};

export const updateRole = async (role: Role): Promise<Role> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const index = mockRoles.findIndex(r => r.id === role.id);
  if (index !== -1) {
    mockRoles[index] = role;
    await addAuditLog('Updated Role', 'rbac', `Updated role: ${role.name}`);
    return role;
  }
  throw new Error('Role not found');
};

export const deleteRole = async (id: string): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const role = mockRoles.find(r => r.id === id);
  if (role?.isSystem) throw new Error('Cannot delete system roles');
  mockRoles = mockRoles.filter(r => r.id !== id);
  await addAuditLog('Deleted Role', 'rbac', `Deleted role with ID: ${id}`);
};

export const fetchUsers = async (): Promise<User[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(doc => doc.data() as User);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
    throw error;
  }
};

export const createUser = async (user: Omit<User, 'id'>): Promise<User> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const newUser: User = {
    ...user,
    id: `u${Math.random().toString(36).substr(2, 9)}`
  };
  mockUsers.push(newUser);
  await addAuditLog('Created User', 'rbac', `Created user: ${newUser.name}`);
  return newUser;
};

export const updateUser = async (user: User): Promise<User> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const index = mockUsers.findIndex(u => u.id === user.id);
  if (index !== -1) {
    mockUsers[index] = user;
    await addAuditLog('Updated User', 'rbac', `Updated user: ${user.name}`);
    return user;
  }
  throw new Error('User not found');
};

export const deleteUser = async (id: string): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  mockUsers = mockUsers.filter(u => u.id !== id);
  await addAuditLog('Deleted User', 'rbac', `Deleted user with ID: ${id}`);
};

export const fetchAuditLogs = async (): Promise<AuditLog[]> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return [...mockAuditLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const addAuditLog = async (action: string, module: ModuleName, details: string): Promise<void> => {
  const newLog: AuditLog = {
    id: `audit-${Math.random().toString(36).substr(2, 9)}`,
    userId: currentUser.id,
    userName: currentUser.name,
    action,
    module,
    details,
    timestamp: new Date().toISOString()
  };
  mockAuditLogs.push(newLog);
};

export const getCurrentUser = async (): Promise<User> => {
  const firebaseUser = auth.currentUser;
  if (firebaseUser) {
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        return userDoc.data() as User;
      }
    } catch (error) {
      console.error("Error fetching current user from Firestore:", error);
    }
  }
  return currentUser;
};

export const switchUser = async (userId: string): Promise<User> => {
  const user = mockUsers.find(u => u.id === userId);
  if (user) {
    currentUser = user;
    return currentUser;
  }
  throw new Error('User not found');
};

export const fetchBranches = async (): Promise<Branch[]> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return [...mockBranches];
};

export const fetchSuppliers = async (): Promise<Supplier[]> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return [...mockSuppliers];
};

export const createSupplier = async (supplier: Omit<Supplier, 'id'>): Promise<Supplier> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const newSupplier: Supplier = {
    ...supplier,
    id: `s${Math.random().toString(36).substr(2, 9)}`
  };
  mockSuppliers.push(newSupplier);
  await addAuditLog('Created Supplier', 'suppliers', `Created supplier: ${newSupplier.name}`);
  return newSupplier;
};

export const fetchPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  const isAdmin = currentUser.roleId === 'role-admin';
  const branchId = currentUser.branchId;
  const filtered = isAdmin ? mockPurchaseOrders : mockPurchaseOrders.filter(po => po.branchId === branchId);
  return [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const createPurchaseOrder = async (po: Omit<PurchaseOrder, 'id' | 'date' | 'status'>): Promise<PurchaseOrder> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  const newPO: PurchaseOrder = {
    ...po,
    id: `PO-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    date: new Date().toISOString(),
    branchId: po.branchId || currentUser.branchId,
    status: 'SENT'
  };
  mockPurchaseOrders.push(newPO);
  await addAuditLog('Created PO', 'procurement', `Created PO for ${newPO.supplierName}`);
  return newPO;
};

export const receivePurchaseOrder = async (id: string): Promise<PurchaseOrder> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  const index = mockPurchaseOrders.findIndex(po => po.id === id);
  if (index === -1) throw new Error('PO not found');
  
  const po = mockPurchaseOrders[index];
  if (po.status === 'RECEIVED') throw new Error('PO already received');

  const updatedPO: PurchaseOrder = {
    ...po,
    status: 'RECEIVED',
    receivedDate: new Date().toISOString()
  };
  mockPurchaseOrders[index] = updatedPO;

  // Update inventory quantities
  po.items.forEach(item => {
    const invIndex = mockInventory.findIndex(i => i.id === item.productId);
    if (invIndex !== -1) {
      mockInventory[invIndex].quantity += item.quantity;
      mockInventory[invIndex].purchasePrice = item.unitPrice; // Update cost price
    }
  });

  await addAuditLog('Received PO', 'procurement', `Received PO: ${id}`);
  return updatedPO;
};

export const fetchInventory = async (): Promise<InventoryItem[]> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const isAdmin = currentUser.roleId === 'role-admin';
  const branchId = currentUser.branchId;
  return isAdmin ? [...mockInventory] : mockInventory.filter(i => i.branchId === branchId);
};

export const hasPermission = (user: User | null | undefined, module: ModuleName, action: ActionType): boolean => {
  if (!user) return false;
  
  // Admin always has all permissions
  if (user.roleId === 'role-admin' || user.id === 'u1') return true;
  
  const role = mockRoles.find(r => r.id === user.roleId);
  if (!role) return false;
  
  const permission = role.permissions.find(p => p.module === module);
  if (!permission) return false;
  
  return permission.actions.includes(action);
};

export const fetchVendorManagementData = async (): Promise<VendorManagementData> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  const totalOwed = mockSuppliers.reduce((sum, s) => sum + s.totalOwed, 0);
  const totalOverdue = mockVendorBills
    .filter(b => b.status !== 'PAID' && new Date(b.dueDate) < new Date())
    .reduce((sum, b) => sum + b.balance, 0);

  return {
    vendors: [...mockSuppliers],
    bills: [...mockVendorBills].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    totalOwed,
    totalOverdue
  };
};

export const createVendorBill = async (bill: Omit<VendorBill, 'id' | 'balance' | 'paidAmount' | 'status'>): Promise<VendorBill> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  const newBill: VendorBill = {
    ...bill,
    id: `bill-${Math.random().toString(36).substr(2, 9)}`,
    paidAmount: 0,
    balance: bill.totalAmount,
    status: 'UNPAID'
  };
  mockVendorBills.push(newBill);
  
  // Update vendor balance
  const vendorIndex = mockSuppliers.findIndex(s => s.id === bill.vendorId);
  if (vendorIndex !== -1) {
    mockSuppliers[vendorIndex].totalOwed += bill.totalAmount;
  }
  
  await addAuditLog('Created Vendor Bill', 'suppliers', `Created bill ${newBill.billNumber} for ${newBill.vendorName}`);
  return newBill;
};

export const recordVendorPayment = async (payment: Omit<VendorPayment, 'id' | 'date'>): Promise<VendorPayment> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  const newPayment: VendorPayment = {
    ...payment,
    id: `vpay-${Math.random().toString(36).substr(2, 9)}`,
    date: new Date().toISOString()
  };
  mockVendorPayments.push(newPayment);
  
  // Update bill status
  const billIndex = mockVendorBills.findIndex(b => b.id === payment.billId);
  if (billIndex !== -1) {
    const bill = mockVendorBills[billIndex];
    bill.paidAmount += payment.amount;
    bill.balance -= payment.amount;
    if (bill.balance <= 0) {
      bill.status = 'PAID';
      bill.balance = 0;
    } else {
      bill.status = 'PARTIALLY_PAID';
    }
  }

  // Update vendor balance
  const vendorIndex = mockSuppliers.findIndex(s => s.id === payment.vendorId);
  if (vendorIndex !== -1) {
    mockSuppliers[vendorIndex].totalOwed -= payment.amount;
    mockSuppliers[vendorIndex].totalPaid += payment.amount;
  }
  
  await addAuditLog('Recorded Vendor Payment', 'suppliers', `Recorded payment of ₹${payment.amount} to ${newPayment.vendorId}`);
  return newPayment;
};
