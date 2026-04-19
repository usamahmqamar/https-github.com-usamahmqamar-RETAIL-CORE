export interface KPIData {
  label: string;
  value: number;
  previousValue: number;
  unit: 'currency' | 'number';
  trend: 'up' | 'down' | 'neutral';
}

export interface SalesTrend {
  date: string;
  sales: number;
}

export interface MonthlySales {
  month: string;
  sales: number;
}

export interface YearlySales {
  year: string;
  sales: number;
}

export interface ChannelBreakdown {
  name: string;
  value: number;
}

export interface PaymentBreakdown {
  name: string;
  value: number;
}

export interface SalesAnalyticsData {
  dailySales: SalesTrend[];
  monthlySales: MonthlySales[];
  yearlySales: YearlySales[];
  channelBreakdown: ChannelBreakdown[];
  paymentBreakdown: PaymentBreakdown[];
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  threshold: number;
  purchasePrice: number;
  sellingPrice: number;
  barcode?: string;
  gstPercent: number;
  expiryDate?: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'expiring-soon';
  branchId: string;
  images?: string[];
}

export interface PaymentRecord {
  id: string;
  amount: number;
  method: 'CASH' | 'UPI' | 'CARD';
  date: string;
  note?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  totalSpent: number;
  ordersCount: number;
  lastPurchaseDate?: string;
  outstandingBalance: number;
  loyaltyPoints: number;
  storeCredit: number;
  orderHistory?: Order[];
}

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  gstPercent: number;
  discountAmount?: number;
  discountType?: 'PERCENT' | 'FIXED';
  totalPrice: number;
}

export interface Order {
  id: string;
  customer?: Customer;
  items: OrderItem[];
  subtotal: number;
  totalGst: number;
  billDiscountAmount?: number;
  billDiscountType?: 'PERCENT' | 'FIXED';
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'STORE_CREDIT' | 'POINTS';
  paymentStatus: 'PAID' | 'PARTIALLY_PAID' | 'UNPAID' | 'REFUNDED';
  paymentHistory?: PaymentRecord[];
  orderType: 'ONLINE' | 'IN_STORE';
  fulfillmentStatus?: 'PENDING' | 'PACKING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  fulfillmentLogs?: FulfillmentLog[];
  promoCode?: string;
  promoDiscount?: number;
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  trackingNumber?: string;
  estimatedDelivery?: string;
  branchId: string;
  date: string;
}

export interface StockEntry {
  id: string;
  productId: string;
  productName: string;
  barcode: string;
  purchasePrice: number;
  sellingPrice: number;
  gstPercent: number;
  quantityAdded: number;
  expiryDate?: string;
  date: string;
  branchId: string;
  actionType: 'STOCK_IN' | 'SALE' | 'RETURN' | 'LOSS_DAMAGED' | 'LOSS_EXPIRED';
  supplierId?: string;
  billNumber?: string;
  dueDate?: string;
  images?: string[];
}

export interface InventoryInsightsData {
  totalStockValue: number;
  potentialRevenue: number;
  lowStockItems: InventoryItem[];
  outOfStockItems: InventoryItem[];
  expiringSoonItems: InventoryItem[];
  allInventory: InventoryItem[];
  stockLogs: StockEntry[];
}

export interface ProfitTrend {
  period: string;
  revenue: number;
  profit: number;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  branchId: string;
  status: 'paid' | 'pending' | 'upcoming';
  recurring?: boolean;
  vendorBillId?: string;
  vendorPaymentId?: string;
}

export interface ExpenseCategoryBreakdown {
  name: string;
  value: number;
  color: string;
}

export interface ExpenseData {
  monthlyTotal: number;
  upcomingTotal: number;
  expenses: Expense[];
  categoryBreakdown: ExpenseCategoryBreakdown[];
}

export type AlertType = 'low-stock' | 'out-of-stock' | 'expiring-soon' | 'high-refunds' | 'negative-profit';

export interface DashboardAlert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  targetTab: 'dashboard' | 'pos' | 'inventory' | 'customers' | 'analytics' | 'profit-loss' | 'expenses' | 'forecasting' | 'suppliers' | 'procurement' | 'branches' | 'loyalty';
  isRead: boolean;
}

export interface ForecastPoint {
  period: string;
  actualSales?: number;
  forecastSales?: number;
  actualProfit?: number;
  forecastProfit?: number;
}

export interface ForecastData {
  expectedMonthlySales: number;
  expectedMonthlyProfit: number;
  growthRate: number;
  confidenceScore: number;
  projectionTrend: ForecastPoint[];
}

export interface PerformanceProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  salesCount: number;
  revenue: number;
  profit: number;
  margin: number;
  trend: 'up' | 'down' | 'stable';
}

export interface TopPerformanceData {
  topSelling: PerformanceProduct[];
  mostProfitable: PerformanceProduct[];
  worstPerforming: PerformanceProduct[];
}

export interface ProfitLossData {
  totalRevenue: number;
  cogs: number;
  expenses: number;
  refunds: number;
  netProfit: number;
  dailyTrend: ProfitTrend[];
  monthlyTrend: ProfitTrend[];
}

export interface DashboardData {
  todaySales: KPIData;
  todayProfit: KPIData;
  monthlySales: KPIData;
  monthlyProfit: KPIData;
  inventoryValue: KPIData;
  monthlyExpenses: KPIData;
  netProfit: KPIData;
  totalReceivables: KPIData;
  customerValue: KPIData;
  salesTrend: SalesTrend[];
  salesSplit: {
    inStore: number;
    online: number;
  };
  alerts: DashboardAlert[];
}

export type ModuleName = 'dashboard' | 'inventory' | 'pos' | 'orders' | 'customers' | 'payments' | 'refunds' | 'expenses' | 'reports' | 'forecasting' | 'performance' | 'rbac' | 'suppliers' | 'procurement' | 'branches' | 'loyalty' | 'profit-loss' | 'users' | 'audit' | 'marketing' | 'fulfillment';

export type ActionType = 'view' | 'create' | 'edit' | 'delete' | 'approve';

export interface Permission {
  module: ModuleName;
  actions: ActionType[];
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystem?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  roleId: string;
  branchId: string;
  isActive: boolean;
  lastLogin?: string;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
  phone: string;
  isActive: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gstNumber?: string;
  paymentTerms?: string;
  totalOwed: number;
  totalPaid: number;
}

export interface VendorBill {
  id: string;
  vendorId: string;
  vendorName: string;
  billNumber: string;
  date: string;
  dueDate: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: 'PAID' | 'PARTIALLY_PAID' | 'UNPAID';
  branchId: string;
  fileUrl?: string;
}

export interface VendorPayment {
  id: string;
  billId: string;
  vendorId: string;
  amount: number;
  date: string;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'UPI';
  referenceNumber?: string;
  note?: string;
}

export interface VendorManagementData {
  vendors: Supplier[];
  bills: VendorBill[];
  totalOwed: number;
  totalOverdue: number;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  status: 'DRAFT' | 'SENT' | 'RECEIVED' | 'CANCELLED';
  branchId: string;
  date: string;
  receivedDate?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: ModuleName | 'Online Order';
  details: string;
  timestamp: string;
}

export interface PromoCode {
  id: string;
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  minOrderAmount: number;
  maxDiscount?: number;
  expiryDate: string;
  isActive: boolean;
  usageLimit?: number;
  usageCount: number;
}

export interface FulfillmentLog {
  status: 'PENDING' | 'PACKING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  timestamp: string;
  note?: string;
  updatedBy: string;
}

export interface SmartProcurementSuggestion {
  productId: string;
  productName: string;
  currentStock: number;
  threshold: number;
  suggestedQuantity: number;
  lastPurchasePrice: number;
  preferredSupplierId?: string;
}
