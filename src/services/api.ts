import { 
  DashboardData, SalesAnalyticsData, InventoryInsightsData, InventoryItem, 
  ProfitLossData, ExpenseData, Expense, DashboardAlert, ForecastData, 
  TopPerformanceData, StockEntry, Order, Customer, PaymentRecord,
  Role, User, AuditLog, ModuleName, ActionType, Branch, Supplier, PurchaseOrder,
  VendorBill, VendorPayment, VendorManagementData, PromoCode, FulfillmentLog,
  SmartProcurementSuggestion
} from "../types";
import { db, auth, handleFirestoreError, OperationType } from "../lib/firebase";
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot, Timestamp, arrayUnion 
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
  try {
    const isAdmin = currentUser.roleId === 'role-admin';
    const branchId = currentUser.branchId;

    const [ordersSnap, inventorySnap, customersSnap, expensesSnap] = await Promise.all([
      getDocs(collection(db, 'orders')),
      getDocs(collection(db, 'inventory')),
      getDocs(collection(db, 'customers')),
      getDocs(collection(db, 'expenses'))
    ]);

    const activeOrders = ordersSnap.docs.map(doc => doc.data() as Order);
    const activeInventory = inventorySnap.docs.map(doc => doc.data() as InventoryItem);
    const activeCustomers = customersSnap.docs.map(doc => doc.data() as Customer);
    const activeExpenses = expensesSnap.docs.map(doc => doc.data() as Expense);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMonthStr = now.toISOString().slice(0, 7);

    const filteredOrders = isAdmin ? activeOrders : activeOrders.filter(o => o.branchId === branchId);
    const filteredInventory = isAdmin ? activeInventory : activeInventory.filter(i => i.branchId === branchId);
    const filteredCustomers = activeCustomers; // Global
    const filteredExpenses = isAdmin ? activeExpenses : activeExpenses.filter(e => e.branchId === branchId);

    const todayOrders = filteredOrders.filter(o => o.date.startsWith(todayStr));
    const monthlyOrders = filteredOrders.filter(o => o.date.startsWith(currentMonthStr));

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

    const totalInventoryValue = filteredInventory.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0);
    const totalReceivables = filteredCustomers.reduce((sum, c) => sum + c.outstandingBalance, 0);
    const avgCustomerValue = filteredCustomers.length > 0 
      ? filteredCustomers.reduce((sum, c) => sum + c.totalSpent, 0) / filteredCustomers.length 
      : 0;

    const monthlyExpensesVal = filteredExpenses
      .filter(e => e.date.startsWith(currentMonthStr) && e.status !== 'upcoming')
      .reduce((sum, e) => sum + e.amount, 0);
    
    // Monthly refunds (TODO: record in firestore as well)
    const monthlyRefundsVal = 0; 
    const netProfitVal = monthlyStats.profit - monthlyExpensesVal - monthlyRefundsVal;

    const alerts: DashboardAlert[] = [];
    filteredInventory.forEach(item => {
      const statusItem = updateItemStatus(item);
      if (statusItem.status === 'out-of-stock') {
        alerts.push({ id: `alert-oos-${item.id}`, type: 'out-of-stock', title: `Out of Stock: ${item.name}`, message: `${item.name} (${item.sku}) is out of stock.`, severity: 'critical', timestamp: new Date().toISOString(), targetTab: 'inventory', isRead: false });
      } else if (statusItem.status === 'low-stock') {
        alerts.push({ id: `alert-low-${item.id}`, type: 'low-stock', title: `Low Stock: ${item.name}`, message: `${item.name} is below threshold (${item.quantity}/${item.threshold}).`, severity: 'high', timestamp: new Date().toISOString(), targetTab: 'inventory', isRead: false });
      }
    });

    return {
      todaySales: { label: "Today's Sales", value: todayStats.sales, previousValue: 11200, unit: 'currency', trend: todayStats.sales >= 11200 ? 'up' : 'down' },
      todayProfit: { label: "Today's Profit", value: todayStats.profit, previousValue: 3100, unit: 'currency', trend: todayStats.profit >= 3100 ? 'up' : 'down' },
      monthlySales: { label: "Monthly Sales", value: monthlyStats.sales, previousValue: 315000, unit: 'currency', trend: monthlyStats.sales >= 315000 ? 'up' : 'down' },
      monthlyProfit: { label: "Monthly Profit", value: monthlyStats.profit, previousValue: 98000, unit: 'currency', trend: monthlyStats.profit >= 98000 ? 'up' : 'down' },
      inventoryValue: { label: "Inventory Value", value: totalInventoryValue, previousValue: 845000, unit: 'currency', trend: 'neutral' },
      monthlyExpenses: { label: "Monthly Expenses", value: monthlyExpensesVal, previousValue: 38000, unit: 'currency', trend: monthlyExpensesVal <= 38000 ? 'up' : 'down' },
      netProfit: { label: "Net Profit", value: netProfitVal, previousValue: 42000, unit: 'currency', trend: netProfitVal >= 42000 ? 'up' : 'down' },
      totalReceivables: { label: "Total Receivables", value: totalReceivables, previousValue: 12000, unit: 'currency', trend: totalReceivables > 5000 ? 'up' : 'down' },
      customerValue: { label: "Avg Customer Value", value: avgCustomerValue, previousValue: 2400, unit: 'currency', trend: 'up' },
      alerts,
      salesTrend: [
        { date: '2026-03-25', sales: 12500 },
        { date: '2026-03-26', sales: 15400 },
        { date: '2026-03-27', sales: 11200 },
        { date: '2026-03-28', sales: 18900 },
        { date: '2026-03-29', sales: 14200 },
        { date: '2026-03-30', sales: 16800 },
        { date: todayStr, sales: todayStats.sales }
      ],
      salesSplit: {
        inStore: monthlyStats.sales * 0.35,
        online: monthlyStats.sales * 0.65
      }
    };
  } catch (error) {
    console.error("Dashboard fetch failed", error);
    throw error;
  }
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
      images: entry.images,
      supplierId: entry.supplierId,
      billNumber: entry.billNumber,
      dueDate: entry.dueDate
    };
    await setDoc(doc(db, 'stock_logs', logId), logEntry);

    // Link to Vendor Accounting: If Supplier and Bill Number provided, auto-create Vendor Bill
    if (entry.supplierId && entry.billNumber) {
      const supplierRef = doc(db, 'suppliers', entry.supplierId);
      const supplierSnap = await getDoc(supplierRef);
      if (supplierSnap.exists()) {
        const supplier = supplierSnap.data() as Supplier;
        await createVendorBill({
          vendorId: entry.supplierId,
          vendorName: supplier.name,
          billNumber: entry.billNumber,
          date: new Date().toISOString().split('T')[0],
          dueDate: entry.dueDate || new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0], // 30 days default
          items: [{
            description: `Auto-generated from Stock Entry: ${entry.productName}`,
            quantity: entry.quantityAdded,
            unitPrice: entry.purchasePrice,
            total: entry.quantityAdded * entry.purchasePrice
          }],
          totalAmount: entry.quantityAdded * entry.purchasePrice,
          branchId: currentUser.branchId
        });
      }
    }

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
  try {
    const orderId = `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const newOrder: Order = {
      ...order,
      id: orderId,
      date: new Date().toISOString(),
      branchId: order.branchId || currentUser.branchId
    };

    await setDoc(doc(db, 'orders', orderId), newOrder);

    // Update inventory stock in Firestore
    for (const item of order.items) {
      const itemRef = doc(db, 'inventory', item.productId);
      const itemSnap = await getDoc(itemRef);
      if (itemSnap.exists()) {
        const currentItem = itemSnap.data() as InventoryItem;
        const newQuantity = Math.max(0, currentItem.quantity - item.quantity);
        await setDoc(itemRef, updateItemStatus({
          ...currentItem,
          quantity: newQuantity
        }));

        // Add stock log for sale
        const logId = Math.random().toString(36).substr(2, 9);
        await setDoc(doc(db, 'stock_logs', logId), {
          id: logId,
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
    }

    // Update customer stats in Firestore if customer is present
    if (order.customer) {
      const customerRef = doc(db, 'customers', order.customer.id);
      const customerSnap = await getDoc(customerRef);
      if (customerSnap.exists()) {
        const currentCustomer = customerSnap.data() as Customer;
        const pointsEarned = Math.floor(order.totalAmount / 100);
        let pointsToDeduct = 0;
        if (order.paymentMethod === 'POINTS') pointsToDeduct = order.amountPaid * 10;
        let creditToDeduct = 0;
        if (order.paymentMethod === 'STORE_CREDIT') creditToDeduct = order.amountPaid;

        await setDoc(customerRef, {
          ...currentCustomer,
          totalSpent: currentCustomer.totalSpent + order.totalAmount,
          ordersCount: currentCustomer.ordersCount + 1,
          lastPurchaseDate: newOrder.date,
          outstandingBalance: currentCustomer.outstandingBalance + order.balanceDue,
          loyaltyPoints: Math.max(0, currentCustomer.loyaltyPoints + pointsEarned - pointsToDeduct),
          storeCredit: Math.max(0, currentCustomer.storeCredit - creditToDeduct)
        });
      }
    }

    await addAuditLog('Created Order', 'pos', `Order created: ${newOrder.id} for ${newOrder.totalAmount}`);
    return newOrder;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'orders');
    throw error;
  }
};

export const fetchCustomers = async (): Promise<Customer[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'customers'));
    const customers = snapshot.docs.map(doc => doc.data() as Customer);
    return customers.sort((a, b) => b.totalSpent - a.totalSpent);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'customers');
    return mockCustomers; // Fallback
  }
};

export const searchCustomer = async (phone: string): Promise<Customer | null> => {
  try {
    const q = query(collection(db, 'customers'), where('phone', '==', phone));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0].data() as Customer;
    }
    return null;
  } catch (error) {
    return mockCustomers.find(c => c.phone === phone) || null;
  }
};

export const createCustomer = async (customer: Omit<Customer, 'id' | 'totalSpent' | 'ordersCount' | 'outstandingBalance' | 'loyaltyPoints' | 'storeCredit'>): Promise<Customer> => {
  try {
    const id = `CUST-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const newCustomer: Customer = {
      ...customer,
      id,
      totalSpent: 0,
      ordersCount: 0,
      outstandingBalance: 0,
      loyaltyPoints: 0,
      storeCredit: 0,
      orderHistory: []
    };
    await setDoc(doc(db, 'customers', id), newCustomer);
    return newCustomer;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'customers');
    throw error;
  }
};

export const recordPayment = async (orderId: string, payment: Omit<PaymentRecord, 'id' | 'date'>): Promise<Order> => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) throw new Error('Order not found');

    const order = orderSnap.data() as Order;
    const newPayment: PaymentRecord = {
      ...payment,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString()
    };

    const newAmountPaid = (order.amountPaid || 0) + payment.amount;
    const newBalanceDue = Math.max(0, (order.totalAmount || 0) - newAmountPaid);
    const newStatus = newBalanceDue === 0 ? 'PAID' : 'PARTIALLY_PAID';

    const updatedOrder: Order = {
      ...order,
      amountPaid: newAmountPaid,
      balanceDue: newBalanceDue,
      paymentStatus: newStatus,
      paymentHistory: [...(order.paymentHistory || []), newPayment]
    };

    await setDoc(orderRef, updatedOrder);

    // Update customer balance in Firestore
    if (order.customer) {
      const customerRef = doc(db, 'customers', order.customer.id);
      const customerSnap = await getDoc(customerRef);
      if (customerSnap.exists()) {
        const customer = customerSnap.data() as Customer;
        if (payment.method === 'CARD' || payment.method === 'CASH' || payment.method === 'UPI') {
          await updateDoc(customerRef, {
            outstandingBalance: Math.max(0, customer.outstandingBalance - payment.amount)
          });
        }
      }
    }

    await addAuditLog('Recorded Payment', 'payments', `Payment of ${payment.amount} for order ${orderId}`);
    return updatedOrder;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'orders');
    throw error;
  }
};

export const refundOrder = async (orderId: string): Promise<Order> => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) throw new Error('Order not found');

    const order = orderSnap.data() as Order;
    
    // Return items to stock
    for (const item of order.items) {
      const invRef = doc(db, 'inventory', item.productId);
      const invSnap = await getDoc(invRef);
      if (invSnap.exists()) {
        const invItem = invSnap.data() as InventoryItem;
        await updateDoc(invRef, {
          quantity: invItem.quantity + item.quantity
        });
        
        // Add log
        const logId = Math.random().toString(36).substr(2, 9);
        await setDoc(doc(db, 'stock_logs', logId), {
          id: logId,
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
    }

    const updatedOrder: Order = {
      ...order,
      paymentStatus: 'REFUNDED' as any,
      amountPaid: 0,
      balanceDue: 0,
    };

    await setDoc(orderRef, updatedOrder);

    // Update customer stats
    if (order.customer) {
      const customerRef = doc(db, 'customers', order.customer.id);
      const customerSnap = await getDoc(customerRef);
      if (customerSnap.exists()) {
        const customer = customerSnap.data() as Customer;
        await updateDoc(customerRef, {
          totalSpent: Math.max(0, customer.totalSpent - order.totalAmount),
          ordersCount: Math.max(0, customer.ordersCount - 1),
          outstandingBalance: Math.max(0, customer.outstandingBalance - order.balanceDue)
        });
      }
    }

    await addAuditLog('Order Refunded', 'refunds', `Refunded order ${orderId} and returned stock`);
    return updatedOrder;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'refunds');
    throw error;
  }
};

export const fetchProfitLossData = async (): Promise<ProfitLossData> => {
  try {
    const isAdmin = currentUser.roleId === 'role-admin';
    const branchId = currentUser.branchId;
    
    const [ordersSnap, expensesSnap] = await Promise.all([
      getDocs(collection(db, 'orders')),
      getDocs(collection(db, 'expenses'))
    ]);

    const allOrders = ordersSnap.docs.map(doc => doc.data() as Order);
    const allExpenses = expensesSnap.docs.map(doc => doc.data() as Expense);

    const filteredOrders = isAdmin ? allOrders : allOrders.filter(o => o.branchId === branchId);
    const filteredExpenses = isAdmin ? allExpenses : allExpenses.filter(e => e.branchId === branchId);

    const now = new Date();
    const currentMonthStr = now.toISOString().slice(0, 7);
    const monthlyOrders = filteredOrders.filter(o => o.date.startsWith(currentMonthStr));
    
    let totalRevenue = 0;
    let cogs = 0;
    filteredOrders.forEach(order => {
      totalRevenue += order.totalAmount;
      order.items.forEach(item => {
        cogs += item.purchasePrice * item.quantity;
      });
    });

    const expenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const refunds = 0; 
    const netProfit = totalRevenue - cogs - expenses - refunds;
    const todayStr = new Date().toISOString().split('T')[0];

    return {
      totalRevenue,
      cogs,
      expenses,
      refunds,
      netProfit,
      dailyTrend: [
        { period: 'Apr 1', revenue: 12000, profit: 3400 },
        { period: 'Apr 2', revenue: 15000, profit: 4200 },
        { period: 'Apr 3', revenue: 11000, profit: 2900 },
        { period: 'Apr 4', revenue: 18000, profit: 5100 },
        { period: todayStr, revenue: totalRevenue / 30, profit: netProfit / 30 }
      ],
      monthlyTrend: [
        { period: 'Jan', revenue: 280000, profit: 45000 },
        { period: 'Feb', revenue: 310000, profit: 52000 },
        { period: 'Mar', revenue: 342000, profit: 58000 },
        { period: 'Apr', revenue: totalRevenue, profit: netProfit }
      ]
    };
  } catch (error) {
    console.error("P&L fetch failed", error);
    throw error;
  }
};
export const fetchExpenseData = async (): Promise<ExpenseData> => {
  try {
    const isAdmin = currentUser.roleId === 'role-admin';
    const branchId = currentUser.branchId;
    
    // Try to fetch from Firestore
    let expenses: Expense[] = [];
    try {
      const snap = await getDocs(collection(db, 'expenses'));
      expenses = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
    } catch (e) {
      console.warn("Firestore expenses not available, using mock", e);
      expenses = mockExpenses;
    }

    const filteredExpenses = isAdmin ? expenses : expenses.filter(e => e.branchId === branchId);

    const categoryBreakdown = [
      { name: 'Payroll', value: filteredExpenses.filter(e => e.category === 'Payroll').reduce((sum, e) => sum + e.amount, 0), color: '#3B82F6' },
      { name: 'Rent', value: filteredExpenses.filter(e => e.category === 'Rent').reduce((sum, e) => sum + e.amount, 0), color: '#10B981' },
      { name: 'Inventory', value: filteredExpenses.filter(e => e.category === 'Inventory').reduce((sum, e) => sum + e.amount, 0), color: '#F59E0B' },
      { name: 'Marketing', value: filteredExpenses.filter(e => e.category === 'Marketing').reduce((sum, e) => sum + e.amount, 0), color: '#EF4444' },
      { name: 'Utilities', value: filteredExpenses.filter(e => e.category === 'Utilities').reduce((sum, e) => sum + e.amount, 0), color: '#8B5CF6' },
      { name: 'Other', value: filteredExpenses.filter(e => !['Payroll', 'Rent', 'Inventory', 'Marketing', 'Utilities'].includes(e.category)).reduce((sum, e) => sum + e.amount, 0), color: '#6B7280' },
    ];

    const now = new Date();
    const currentMonthPrefix = now.toISOString().slice(0, 7);

    const monthlyTotal = filteredExpenses
      .filter(e => e.date.startsWith(currentMonthPrefix) && e.status !== 'upcoming')
      .reduce((sum, e) => sum + e.amount, 0);

    const upcomingTotal = filteredExpenses
      .filter(e => e.status === 'upcoming' || e.status === 'pending')
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      monthlyTotal,
      upcomingTotal,
      expenses: filteredExpenses.sort((a, b) => b.date.localeCompare(a.date)),
      categoryBreakdown
    };
  } catch (error) {
    console.error("fetchExpenseData failed", error);
    throw error;
  }
};

export const addExpense = async (expense: Omit<Expense, 'id'>): Promise<Expense> => {
  try {
    const branchId = expense.branchId || currentUser.branchId;
    const docRef = await addDoc(collection(db, 'expenses'), {
      ...expense,
      branchId,
      timestamp: Timestamp.now()
    });
    
    const newExpense: Expense = {
      ...expense,
      id: docRef.id,
      branchId
    };
    
    return newExpense;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'expenses');
    throw error;
  }
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
  try {
    const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(100));
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data() as AuditLog);
  } catch (error) {
    console.warn("Audit logs fetch failed, using mock", error);
    return [...mockAuditLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
};

export const addAuditLog = async (action: string, module: ModuleName | 'Online Order' | 'Online Purchase' | 'System' | 'Suppliers' | 'Procurement' | 'Inventory', details: string): Promise<void> => {
  try {
    const newLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'System Auto',
      action,
      module: module as any,
      details,
      timestamp: new Date().toISOString()
    };

    await addDoc(collection(db, 'audit_logs'), newLog);
  } catch (error) {
    console.warn("Failed to save audit log to Firestore", error);
    // Fallback to mock for session persistence
    mockAuditLogs.push({
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'System Auto',
      action,
      module: module as any,
      details,
      timestamp: new Date().toISOString()
    });
  }
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
  try {
    const suppliersRef = collection(db, 'suppliers');
    const snapshot = await getDocs(suppliersRef);
    const suppliers = snapshot.docs.map(doc => ({
      ...doc.data() as Supplier,
      id: doc.id
    }));
    return suppliers.length > 0 ? suppliers : mockSuppliers;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'suppliers');
    return mockSuppliers;
  }
};

export const createSupplier = async (supplier: Omit<Supplier, 'id'>): Promise<Supplier> => {
  try {
    const supplierId = `s${Math.random().toString(36).substr(2, 9)}`;
    const newSupplier: Supplier = {
      ...supplier,
      id: supplierId
    };
    await setDoc(doc(db, 'suppliers', supplierId), newSupplier);
    await addAuditLog('Created Supplier', 'suppliers', `Created supplier: ${newSupplier.name}`);
    return newSupplier;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'suppliers');
    throw error;
  }
};

export const fetchPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
  try {
    const poRef = collection(db, 'purchase_orders');
    const isAdmin = currentUser.roleId === 'role-admin';
    const branchId = currentUser.branchId;
    
    const q = isAdmin 
      ? query(poRef, orderBy('date', 'desc'))
      : query(poRef, where('branchId', '==', branchId), orderBy('date', 'desc'));
      
    const snapshot = await getDocs(q);
    const pos = snapshot.docs.map(doc => doc.data() as PurchaseOrder);
    return pos.length > 0 ? pos : mockPurchaseOrders;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'procurement');
    return mockPurchaseOrders;
  }
};

export const createPurchaseOrder = async (po: Omit<PurchaseOrder, 'id' | 'date' | 'status'>): Promise<PurchaseOrder> => {
  try {
    const poId = `PO-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const newPO: PurchaseOrder = {
      ...po,
      id: poId,
      date: new Date().toISOString(),
      branchId: po.branchId || currentUser.branchId,
      status: 'SENT'
    };
    await setDoc(doc(db, 'purchase_orders', poId), newPO);
    await addAuditLog('Created PO', 'procurement', `Created PO for ${newPO.supplierName}`);
    return newPO;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'procurement');
    throw error;
  }
};

export const receivePurchaseOrder = async (id: string): Promise<PurchaseOrder> => {
  try {
    const poRef = doc(db, 'purchase_orders', id);
    const poSnap = await getDoc(poRef);
    if (!poSnap.exists()) throw new Error('PO not found');
    
    const po = poSnap.data() as PurchaseOrder;
    if (po.status === 'RECEIVED') throw new Error('PO already received');

    const updatedPO: PurchaseOrder = {
      ...po,
      status: 'RECEIVED',
      receivedDate: new Date().toISOString()
    };
    
    await setDoc(poRef, updatedPO);

    // Update inventory quantities in Firestore
    for (const item of po.items) {
      const invRef = doc(db, 'inventory', item.productId);
      const invSnap = await getDoc(invRef);
      if (invSnap.exists()) {
        const invItem = invSnap.data() as InventoryItem;
        const updatedItem = updateItemStatus({
          ...invItem,
          quantity: invItem.quantity + item.quantity,
          purchasePrice: item.unitPrice
        });
        await setDoc(invRef, updatedItem);
      }
    }

    // Auto-generate a Vendor Bill for this PO to link inventory with financial liability
    await createVendorBill({
      vendorId: po.supplierId,
      vendorName: po.supplierName,
      billNumber: `BILL-${po.id.replace('PO-', '')}`,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0], // 30 days default
      items: po.items.map(item => ({
        description: `Items received from PO: ${po.id} - ${item.productName}`,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice
      })),
      totalAmount: po.totalAmount,
      branchId: po.branchId
    });

    await addAuditLog('Received PO', 'procurement', `Received PO: ${id} and created auto-bill`);
    return updatedPO;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'procurement');
    throw error;
  }
};

export const fetchInventory = async (): Promise<InventoryItem[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'inventory'));
    const items = snapshot.docs.map(doc => ({
      ...doc.data() as InventoryItem,
      id: doc.id
    }));
    
    const isAdmin = currentUser?.roleId === 'role-admin';
    const branchId = currentUser?.branchId;
    
    const filtered = isAdmin ? items : items.filter(i => i.branchId === branchId);
    return filtered.length > 0 ? filtered.map(updateItemStatus) : mockInventory;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'inventory');
    return mockInventory;
  }
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
  try {
    const [suppliersSnap, billsSnap] = await Promise.all([
      getDocs(collection(db, 'suppliers')),
      getDocs(query(collection(db, 'vendor_bills'), orderBy('date', 'desc')))
    ]);

    const suppliers = suppliersSnap.docs.map(doc => doc.data() as Supplier);
    const bills = billsSnap.docs.map(doc => doc.data() as VendorBill);

    const activeSuppliers = suppliers.length > 0 ? suppliers : mockSuppliers;
    const activeBills = bills.length > 0 ? bills : mockVendorBills;

    const totalOwed = activeSuppliers.reduce((sum, s) => sum + (s.totalOwed || 0), 0);
    const totalOverdue = activeBills
      .filter(b => b.status !== 'PAID' && new Date(b.dueDate) < new Date())
      .reduce((sum, b) => sum + b.balance, 0);

    return {
      vendors: activeSuppliers,
      bills: activeBills,
      totalOwed,
      totalOverdue
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'suppliers');
    return {
      vendors: mockSuppliers,
      bills: mockVendorBills,
      totalOwed: 0,
      totalOverdue: 0
    };
  }
};

export const createVendorBill = async (bill: Omit<VendorBill, 'id' | 'balance' | 'paidAmount' | 'status'>): Promise<VendorBill> => {
  try {
    const billId = `bill-${Math.random().toString(36).substr(2, 9)}`;
    const newBill: VendorBill = {
      ...bill,
      id: billId,
      paidAmount: 0,
      balance: bill.totalAmount,
      status: 'UNPAID'
    };
    
    await setDoc(doc(db, 'vendor_bills', billId), newBill);

    // Update vendor balance in Firestore
    const supplierRef = doc(db, 'suppliers', bill.vendorId);
    const supplierSnap = await getDoc(supplierRef);
    if (supplierSnap.exists()) {
      const supplier = supplierSnap.data() as Supplier;
      await updateDoc(supplierRef, {
        totalOwed: (supplier.totalOwed || 0) + bill.totalAmount
      });
    }

    // Unified Expense Integration: Record this bill as a pending expense
    await addExpense({
      title: `Vendor Bill: ${bill.billNumber} (${bill.vendorName})`,
      amount: bill.totalAmount,
      category: 'Inventory',
      date: bill.date,
      branchId: bill.branchId,
      status: 'pending',
      vendorBillId: billId
    });

    await addAuditLog('Created Vendor Bill', 'suppliers', `Created bill ${newBill.billNumber} for ${newBill.vendorName}`);
    return newBill;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'suppliers');
    throw error;
  }
};

export const recordVendorPayment = async (payment: Omit<VendorPayment, 'id' | 'date'>): Promise<VendorPayment> => {
  try {
    const paymentId = `vpay-${Math.random().toString(36).substr(2, 9)}`;
    const newPayment: VendorPayment = {
      ...payment,
      id: paymentId,
      date: new Date().toISOString()
    };
    
    await setDoc(doc(db, 'vendor_payments', paymentId), newPayment);

    // Update bill status in Firestore
    const billRef = doc(db, 'vendor_bills', payment.billId);
    const billSnap = await getDoc(billRef);
    if (billSnap.exists()) {
      const bill = billSnap.data() as VendorBill;
      const newPaidAmount = (bill.paidAmount || 0) + payment.amount;
      const newBalance = Math.max(0, bill.totalAmount - newPaidAmount);
      const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID';
      
      await updateDoc(billRef, {
        paidAmount: newPaidAmount,
        balance: newBalance,
        status: newStatus
      });

      // Unified Expense Integration: Update linked expense record to "paid" if bill is now fully paid
      if (newStatus === 'PAID') {
        const expensesRef = collection(db, 'expenses');
        const q = query(expensesRef, where('vendorBillId', '==', payment.billId));
        const expenseSnap = await getDocs(q);
        if (!expenseSnap.empty) {
          await updateDoc(doc(db, 'expenses', expenseSnap.docs[0].id), {
            status: 'paid',
            vendorPaymentId: paymentId
          });
        }
      }
    }

    // Update vendor balance in Firestore
    const supplierRef = doc(db, 'suppliers', payment.vendorId);
    const supplierSnap = await getDoc(supplierRef);
    if (supplierSnap.exists()) {
      const supplier = supplierSnap.data() as Supplier;
      await updateDoc(supplierRef, {
        totalOwed: Math.max(0, (supplier.totalOwed || 0) - payment.amount),
        totalPaid: (supplier.totalPaid || 0) + payment.amount
      });
    }

    await addAuditLog('Recorded Vendor Payment', 'suppliers', `Recorded payment of ₹${payment.amount} to ${newPayment.vendorId}`);
    return newPayment;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'suppliers');
    throw error;
  }
};

export const createOnlineOrder = async (orderData: Partial<Order>): Promise<Order> => {
  try {
    const orderId = `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const newOrder: Order = {
      ...orderData as Order,
      id: orderId,
      date: new Date().toISOString(),
      orderType: 'ONLINE',
      fulfillmentStatus: 'PENDING',
      paymentStatus: orderData.paymentMethod === 'CASH' ? 'UNPAID' : 'PAID',
      trackingNumber: `TRK-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      estimatedDelivery: new Date(Date.now() + 86400000 * 2).toISOString(), // 48 hours from now
    };

    await setDoc(doc(db, 'orders', orderId), newOrder);
    
    // Update inventory for each item
    for (const item of newOrder.items) {
      const itemRef = doc(db, 'inventory', item.productId);
      const itemSnap = await getDoc(itemRef);
      if (itemSnap.exists()) {
        const currentItem = itemSnap.data() as InventoryItem;
        const newQuantity = Math.max(0, currentItem.quantity - item.quantity);
        await setDoc(itemRef, updateItemStatus({
          ...currentItem,
          quantity: newQuantity
        }));
      }
    }

    await addAuditLog('Online Order', 'orders', `New online order ${orderId} placed for ${formatCurrency(newOrder.totalAmount)}`);
    return newOrder;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'orders');
    throw error;
  }
};

export const fetchOrderById = async (orderId: string): Promise<Order | null> => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    if (orderSnap.exists()) {
      return orderSnap.data() as Order;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'orders');
    throw error;
  }
};

export const fetchOrdersByPhone = async (phone: string): Promise<Order[]> => {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('customer.phone', '==', phone), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Order);
  } catch (error) {
    // If phone field is deep, we might fallback to local filtering if index is missing
    console.warn("Phone query may require index, falling back to client-side filter", error);
    const snapshot = await getDocs(collection(db, 'orders'));
    return (snapshot.docs.map(doc => doc.data() as Order))
      .filter(o => o.customer?.phone === phone)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
};

export const fetchOnlineOrders = async (): Promise<Order[]> => {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('orderType', '==', 'ONLINE'), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Order);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'orders');
    throw error;
  }
};

export const updateOrderFulfillmentStatus = async (
  orderId: string, 
  status: Order['fulfillmentStatus'], 
  note?: string
): Promise<void> => {
  try {
    const user = await getCurrentUser();
    const orderRef = doc(db, 'orders', orderId);
    
    const newLog: FulfillmentLog = {
      status: status!,
      timestamp: new Date().toISOString(),
      note,
      updatedBy: user.name
    };

    await updateDoc(orderRef, {
      fulfillmentStatus: status,
      fulfillmentLogs: arrayUnion(newLog)
    });

    await addAuditLog('Order Status Update', 'fulfillment', `Order ${orderId} changed to ${status}`);
    
    // Status Notification Emulation
    const orderSnap = await getDoc(orderRef);
    const orderData = orderSnap.data() as Order;
    if (orderData.customer?.phone) {
      console.log(`[NOTIFY] To ${orderData.customer.phone}: Your order ${orderId} is now ${status}. ${note || ''}`);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'orders');
    throw error;
  }
};

export const fetchPromoCodes = async (): Promise<PromoCode[]> => {
  try {
    const promoRef = collection(db, 'promo_codes');
    const snapshot = await getDocs(promoRef);
    return snapshot.docs.map(doc => doc.data() as PromoCode);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'promo_codes');
    return [];
  }
};

export const savePromoCode = async (promo: PromoCode): Promise<void> => {
  try {
    await setDoc(doc(db, 'promo_codes', promo.id), promo);
    await addAuditLog('Saved Promo Code', 'marketing', `Created/Updated promo code ${promo.code}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'promo_codes');
  }
};

export const validatePromoCode = async (code: string, amount: number): Promise<PromoCode | null> => {
  try {
    const q = query(collection(db, 'promo_codes'), where('code', '==', code.toUpperCase()), where('isActive', '==', true));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    
    const promo = snap.docs[0].data() as PromoCode;
    if (new Date(promo.expiryDate) < new Date()) return null;
    if (amount < promo.minOrderAmount) return null;
    if (promo.usageLimit && promo.usageCount >= promo.usageLimit) return null;
    
    return promo;
  } catch (error) {
    return null;
  }
};

export const deletePromoCode = async (id: string): Promise<void> => {
  try {
    const promoRef = doc(db, 'promo_codes', id);
    const snap = await getDoc(promoRef);
    const code = snap.exists() ? (snap.data() as PromoCode).code : id;
    
    await deleteDoc(promoRef);
    await addAuditLog('Deleted Promo Code', 'marketing', `Deleted promo code ${code}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'promo_codes');
  }
};

export const generateProcurementSuggestions = async (): Promise<SmartProcurementSuggestion[]> => {
  try {
    const data = await fetchInventoryInsightsData();
    const problematicItems = [...data.lowStockItems, ...data.outOfStockItems];
    
    return problematicItems.map(item => ({
      productId: item.id,
      productName: item.name,
      currentStock: item.quantity,
      threshold: item.threshold,
      suggestedQuantity: Math.max(0, (item.threshold * 2) - item.quantity),
      lastPurchasePrice: item.purchasePrice,
    }));
  } catch (error) {
    console.error("Procurement suggestion failed", error);
    return [];
  }
};

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
