import React, { useEffect, useState, useRef } from 'react';
import { 
  Search, 
  Barcode, 
  ShoppingCart, 
  User, 
  Phone, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  CheckCircle2, 
  X, 
  Printer, 
  Camera,
  ArrowRight,
  UserPlus,
  RefreshCcw
} from 'lucide-react';
import { fetchInventoryInsightsData, createOrder, searchCustomer, createCustomer, hasPermission } from '../services/api';
import { InventoryItem, OrderItem, Customer, Order, User as UserType } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface POSProps {
  onOrderComplete?: () => void;
  currentUser: UserType | null;
  lastScannedCode: string | null;
}

export const POS: React.FC<POSProps> = ({ onOrderComplete, currentUser, lastScannedCode }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD' | 'STORE_CREDIT' | 'POINTS'>('CASH');
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [useStoreCredit, setUseStoreCredit] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [billDiscountAmount, setBillDiscountAmount] = useState(0);
  const [billDiscountType, setBillDiscountType] = useState<'PERCENT' | 'FIXED'>('FIXED');
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [amountPaid, setAmountPaid] = useState(0);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    const loadInventory = async () => {
      const data = await fetchInventoryInsightsData();
      setInventory(data.allInventory);
    };
    loadInventory();
  }, []);

  useEffect(() => {
    if (lastScannedCode) {
      handleBarcodeSubmit(lastScannedCode);
    }
  }, [lastScannedCode]);

  useEffect(() => {
    if (showScanner) {
      scannerRef.current = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      scannerRef.current.render(onScanSuccess, onScanFailure);
    } else {
      if (scannerRef.current) {
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    }
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, [showScanner]);

  const onScanSuccess = (decodedText: string) => {
    handleBarcodeSubmit(decodedText);
    setShowScanner(false);
  };

  const onScanFailure = (error: any) => {
    // console.warn(`Code scan error = ${error}`);
  };

  const addToCart = (product: InventoryItem) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.sellingPrice } 
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: 1,
        purchasePrice: product.purchasePrice,
        sellingPrice: product.sellingPrice,
        gstPercent: product.gstPercent,
        discountAmount: 0,
        discountType: 'FIXED',
        totalPrice: product.sellingPrice
      }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        const discountedPrice = item.discountType === 'PERCENT' 
          ? item.sellingPrice * (1 - (item.discountAmount || 0) / 100)
          : item.sellingPrice - (item.discountAmount || 0);
        return { ...item, quantity: newQty, totalPrice: newQty * discountedPrice };
      }
      return item;
    }));
  };

  const updateItemDiscount = (productId: string, amount: number, type: 'PERCENT' | 'FIXED') => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const discountedPrice = type === 'PERCENT' 
          ? item.sellingPrice * (1 - amount / 100)
          : item.sellingPrice - amount;
        return { 
          ...item, 
          discountAmount: amount, 
          discountType: type, 
          totalPrice: item.quantity * discountedPrice 
        };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const handleBarcodeSubmit = (code: string) => {
    const product = inventory.find(i => i.sku === code || i.barcode === code);
    if (product) {
      addToCart(product);
      setBarcodeInput('');
    }
  };

  const handleCustomerSearch = async () => {
    if (!customerPhone) return;
    setIsSearchingCustomer(true);
    try {
      const found = await searchCustomer(customerPhone);
      if (found) {
        setCustomer(found);
      } else {
        setIsCreatingCustomer(true);
      }
    } finally {
      setIsSearchingCustomer(false);
    }
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerName || !customerPhone) return;
    const created = await createCustomer({ name: newCustomerName, phone: customerPhone });
    setCustomer(created);
    setIsCreatingCustomer(false);
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.totalPrice / (1 + item.gstPercent / 100)), 0);
  const totalGst = cart.reduce((sum, item) => sum + (item.totalPrice - (item.totalPrice / (1 + item.gstPercent / 100))), 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  
  const billDiscount = billDiscountType === 'PERCENT' 
    ? cartTotal * (billDiscountAmount / 100)
    : billDiscountAmount;
  
  const totalAmount = Math.max(0, cartTotal - billDiscount);

  useEffect(() => {
    if (!isPartialPayment) {
      setAmountPaid(totalAmount);
    }
  }, [totalAmount, isPartialPayment]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);
    try {
      let finalCustomer = customer;
      
      // Auto-create customer if phone exists but no customer selected
      if (!finalCustomer && customerPhone) {
        finalCustomer = await createCustomer({ 
          name: newCustomerName || `Customer ${customerPhone.slice(-4)}`, 
          phone: customerPhone 
        });
      }

      const balanceDue = Math.max(0, totalAmount - amountPaid);
      const paymentStatus = balanceDue === 0 ? 'PAID' : (amountPaid === 0 ? 'UNPAID' : 'PARTIALLY_PAID');

      const order = await createOrder({
        customer: finalCustomer || undefined,
        items: cart,
        subtotal,
        totalGst,
        billDiscountAmount,
        billDiscountType,
        totalAmount,
        amountPaid,
        balanceDue,
        paymentMethod,
        paymentStatus,
        orderType: 'IN_STORE',
        branchId: currentUser?.branchId || 'b1'
      });
      setCompletedOrder(order);
      setCart([]);
      setCustomer(null);
      setCustomerPhone('');
      setNewCustomerName('');
      setBillDiscountAmount(0);
      setIsPartialPayment(false);
      if (onOrderComplete) onOrderComplete();
    } finally {
      setIsCheckingOut(false);
    }
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);

  const filteredProducts = inventory.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-220px)] min-h-[600px]" id="pos-module">
      {/* Left Side: Cart Items (Widened) */}
      <div className="flex-1 glass-card flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="section-header mb-0">
            <ShoppingCart className="w-4 h-4 text-slate-900" />
            Current Transaction
          </h3>
          <div className="flex items-center gap-3">
            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {cart.length} Items
            </span>
            {cart.length > 0 && (
              <button 
                onClick={() => setCart([])}
                className="text-[10px] text-rose-600 hover:text-rose-700 font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Clear All
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 opacity-40">
              <div className="p-6 bg-slate-50 rounded-full">
                <ShoppingCart className="w-16 h-16" />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">Your cart is empty</p>
                <p className="text-sm">Scan a barcode or search for items to start billing</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white/80 backdrop-blur-md z-10">
                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Product Details</th>
                  <th className="px-6 py-4 text-center">Quantity</th>
                  <th className="px-6 py-4 text-right">Unit Price</th>
                  <th className="px-6 py-4 text-center">Discount</th>
                  <th className="px-6 py-4 text-right">GST</th>
                  <th className="px-6 py-4 text-right">Total</th>
                  <th className="px-6 py-4 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {cart.map(item => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={item.productId} 
                    className="group hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{item.productName}</p>
                      <p className="text-xs text-slate-400 font-mono">{item.sku}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3 bg-slate-50 w-fit mx-auto p-1 rounded-lg border border-slate-100">
                        <button 
                          onClick={() => updateQuantity(item.productId, -1)}
                          className="p-1 hover:bg-white hover:shadow-sm rounded-md text-slate-400 transition-all"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.productId, 1)}
                          className="p-1 hover:bg-white hover:shadow-sm rounded-md text-slate-900 transition-all"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-600">
                      {formatCurrency(item.sellingPrice)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100 w-fit mx-auto">
                        <input 
                          type="number"
                          className="w-12 bg-transparent text-xs font-bold text-center focus:outline-none"
                          value={item.discountAmount || 0}
                          onChange={(e) => updateItemDiscount(item.productId, Number(e.target.value), item.discountType || 'FIXED')}
                        />
                        <button 
                          onClick={() => updateItemDiscount(item.productId, item.discountAmount || 0, item.discountType === 'FIXED' ? 'PERCENT' : 'FIXED')}
                          className="text-[10px] font-black text-slate-400 hover:text-slate-900 px-1"
                        >
                          {item.discountType === 'PERCENT' ? '%' : '₹'}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                        {item.gstPercent}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                      {formatCurrency(item.totalPrice)}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => removeFromCart(item.productId)}
                        className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Right Side: Sidebar (Inputs, Customer, Checkout) */}
      <div className="w-full lg:w-[400px] flex flex-col gap-6 overflow-y-auto no-scrollbar pb-10">
        {/* Product Input Section */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="section-header mb-0">
              <Barcode className="w-4 h-4" />
              Add Items
            </h3>
            <button 
              onClick={() => setShowScanner(!showScanner)}
              className={cn(
                "p-2 rounded-xl transition-all",
                showScanner ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
              title={showScanner ? 'Close Scanner' : 'Open Scanner'}
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>

          <AnimatePresence>
            {showScanner && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div id="reader" className="w-full rounded-xl overflow-hidden border border-slate-200"></div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-3">
            <div className="relative">
              <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Scan Barcode & Enter..." 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBarcodeSubmit(barcodeInput)}
              />
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search product..." 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              {/* Search Results Dropdown */}
              <AnimatePresence>
                {searchTerm && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 z-50 max-h-60 overflow-y-auto no-scrollbar"
                  >
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map(product => (
                        <button
                          key={product.id}
                          onClick={() => { addToCart(product); setSearchTerm(''); }}
                          className="w-full p-3 text-left hover:bg-slate-50 flex items-center justify-between border-b border-slate-50 last:border-0"
                        >
                          <div>
                            <p className="text-sm font-bold text-slate-900">{product.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{product.sku}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-900">{formatCurrency(product.sellingPrice)}</p>
                            <p className="text-[10px] text-slate-400">Stock: {product.quantity}</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-slate-400 text-sm">No products found</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Customer Section */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="section-header mb-0">
              <User className="w-4 h-4" />
              Customer
            </h3>
            {customer && (
              <button 
                onClick={() => { setCustomer(null); setCustomerPhone(''); }}
                className="text-[10px] font-bold text-rose-600 hover:underline uppercase tracking-wider"
              >
                Change
              </button>
            )}
          </div>

            {!customer ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Phone number..." 
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCustomerSearch()}
                    />
                  </div>
                  <button 
                    onClick={handleCustomerSearch}
                    disabled={isSearchingCustomer}
                    className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    {isSearchingCustomer ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  </button>
                </div>

                <AnimatePresence>
                  {isCreatingCustomer && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-slate-50 rounded-xl space-y-3"
                    >
                      <p className="text-xs font-medium text-slate-800">Customer not found. Create new?</p>
                      <input 
                        type="text" 
                        placeholder="Customer Name" 
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none"
                        value={newCustomerName}
                        onChange={(e) => setNewCustomerName(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button 
                          onClick={handleCreateCustomer}
                          className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800"
                        >
                          Create & Select
                        </button>
                        <button 
                          onClick={() => setIsCreatingCustomer(false)}
                          className="px-4 py-2 bg-white text-slate-500 rounded-lg text-xs font-bold border border-slate-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold">
                    {customer.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{customer.name}</p>
                    <p className="text-xs text-slate-500">{customer.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-600 uppercase">Loyalty</p>
                    <p className="text-xs font-bold">{customer.loyaltyPoints} Pts</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setUseLoyaltyPoints(!useLoyaltyPoints);
                      if (!useLoyaltyPoints) {
                        setPaymentMethod('POINTS');
                        setAmountPaid(Math.min(totalAmount, customer.loyaltyPoints * 0.1));
                        setIsPartialPayment(true);
                      } else {
                        setPaymentMethod('CASH');
                        setIsPartialPayment(false);
                      }
                    }}
                    disabled={customer.loyaltyPoints === 0}
                    className={cn(
                      "flex items-center justify-center gap-2 p-2 rounded-lg border text-xs font-bold transition-all",
                      useLoyaltyPoints ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-100 hover:bg-slate-50"
                    )}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    Use Points
                  </button>
                  <button
                    onClick={() => {
                      setUseStoreCredit(!useStoreCredit);
                      if (!useStoreCredit) {
                        setPaymentMethod('STORE_CREDIT');
                        setAmountPaid(Math.min(totalAmount, customer.storeCredit));
                        setIsPartialPayment(true);
                      } else {
                        setPaymentMethod('CASH');
                        setIsPartialPayment(false);
                      }
                    }}
                    disabled={customer.storeCredit === 0}
                    className={cn(
                      "flex items-center justify-center gap-2 p-2 rounded-lg border text-xs font-bold transition-all",
                      useStoreCredit ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-emerald-600 border-emerald-100 hover:bg-emerald-50"
                    )}
                  >
                    <Banknote className="w-3 h-3" />
                    Use Credit
                  </button>
                </div>
              </div>
            )}
        </div>

        {/* Checkout Section */}
        <div className="glass-card flex flex-col overflow-hidden">
          <div className="p-6 bg-slate-50/50 border-b border-slate-100 space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Subtotal (Excl. GST)</span>
                <span className="text-slate-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Total GST</span>
                <span className="text-slate-900">{formatCurrency(totalGst)}</span>
              </div>
              
              {/* Bill Discount Section */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bill Discount</span>
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                  <input 
                    type="number"
                    className="w-16 text-right text-xs font-bold focus:outline-none"
                    value={billDiscountAmount}
                    onChange={(e) => setBillDiscountAmount(Number(e.target.value))}
                  />
                  <button 
                    onClick={() => setBillDiscountType(billDiscountType === 'FIXED' ? 'PERCENT' : 'FIXED')}
                    className="text-[10px] font-black text-slate-400 hover:text-slate-900 px-1"
                  >
                    {billDiscountType === 'PERCENT' ? '%' : '₹'}
                  </button>
                </div>
              </div>

              <div className="flex justify-between text-xl font-black text-slate-900 pt-2 border-t border-slate-100">
                <span className="tracking-tighter uppercase">Total Bill</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            {/* Payment Input */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-400 uppercase">Payment Received</label>
                <button 
                  onClick={() => setIsPartialPayment(!isPartialPayment)}
                  className={cn(
                    "text-[10px] font-bold px-2 py-1 rounded-md transition-colors",
                    isPartialPayment ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                  )}
                >
                  {isPartialPayment ? "Partial Mode" : "Full Payment"}
                </button>
              </div>
              
              <div className="relative">
                <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="number" 
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-lg font-black focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  value={amountPaid}
                  onChange={(e) => {
                    setAmountPaid(Number(e.target.value));
                    setIsPartialPayment(true);
                  }}
                  disabled={!isPartialPayment && totalAmount > 0}
                />
              </div>

              {isPartialPayment && (
                <div className="flex justify-between items-center p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <span className="text-xs font-medium text-amber-800 tracking-tight">Balance Due (Credit)</span>
                  <span className="text-sm font-bold text-amber-900">{formatCurrency(Math.max(0, totalAmount - amountPaid))}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-5 gap-1">
              <button 
                onClick={() => setPaymentMethod('CASH')}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-xl border transition-all",
                  paymentMethod === 'CASH' ? "bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-200" : "bg-white text-slate-500 border-slate-100 hover:border-slate-200"
                )}
              >
                <Banknote className="w-4 h-4" />
                <span className="text-[8px] font-bold">Cash</span>
              </button>
              <button 
                onClick={() => setPaymentMethod('UPI')}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-xl border transition-all",
                  paymentMethod === 'UPI' ? "bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-200" : "bg-white text-slate-500 border-slate-100 hover:border-slate-200"
                )}
              >
                <Smartphone className="w-4 h-4" />
                <span className="text-[8px] font-bold">UPI</span>
              </button>
              <button 
                onClick={() => setPaymentMethod('CARD')}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-xl border transition-all",
                  paymentMethod === 'CARD' ? "bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-200" : "bg-white text-slate-500 border-slate-100 hover:border-slate-200"
                )}
              >
                <CreditCard className="w-4 h-4" />
                <span className="text-[8px] font-bold">Card</span>
              </button>
              <button 
                onClick={() => setPaymentMethod('POINTS')}
                disabled={!customer || customer.loyaltyPoints === 0}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-xl border transition-all",
                  paymentMethod === 'POINTS' ? "bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-200" : "bg-white text-slate-500 border-slate-100 hover:border-slate-200 disabled:opacity-30"
                )}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-[8px] font-bold">Points</span>
              </button>
              <button 
                onClick={() => setPaymentMethod('STORE_CREDIT')}
                disabled={!customer || customer.storeCredit === 0}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-xl border transition-all",
                  paymentMethod === 'STORE_CREDIT' ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-100" : "bg-white text-emerald-600 border-emerald-100 hover:bg-emerald-50 disabled:opacity-30"
                )}
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="text-[8px] font-bold">Credit</span>
              </button>
            </div>

            <button 
              onClick={handleCheckout}
              disabled={cart.length === 0 || isCheckingOut || !hasPermission(currentUser, 'pos', 'create')}
              className="btn-primary w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isCheckingOut ? (
                <RefreshCcw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {!hasPermission(currentUser, 'pos', 'create') ? 'No Permission to Bill' : 'Complete Transaction'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      <AnimatePresence>
        {completedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  <h3 className="text-xl font-bold text-emerald-900">Payment Successful</h3>
                </div>
                <button 
                  onClick={() => setCompletedOrder(null)}
                  className="p-2 hover:bg-emerald-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-emerald-600" />
                </button>
              </div>

              <div className="p-8 space-y-6" id="invoice-content">
                <div className="text-center space-y-1">
                  <h2 className="text-2xl font-black tracking-tighter uppercase text-slate-900">RetailCore</h2>
                  <p className="text-xs text-slate-400">123 Business Avenue, Tech City, 560001</p>
                  <p className="text-xs text-slate-400">GSTIN: 29AAAAA0000A1Z5</p>
                </div>

                <div className="flex justify-between text-xs border-y border-dashed border-slate-200 py-3">
                  <div className="space-y-1">
                    <p className="text-slate-400 uppercase tracking-wider">Order ID</p>
                    <p className="font-bold text-slate-900">{completedOrder.id}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-slate-400 uppercase tracking-wider">Date</p>
                    <p className="font-bold text-slate-900">{new Date(completedOrder.date).toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-100">
                    <span className="col-span-2">Item</span>
                    <span className="text-center">Qty</span>
                    <span className="text-right">Price</span>
                  </div>
                  <div className="space-y-3">
                    {completedOrder.items.map(item => (
                      <div key={item.productId} className="grid grid-cols-4 text-sm">
                        <div className="col-span-2">
                          <p className="font-bold text-slate-900">{item.productName}</p>
                          <p className="text-[10px] text-slate-400">GST {item.gstPercent}% Included</p>
                        </div>
                        <span className="text-center text-slate-500">x{item.quantity}</span>
                        <span className="text-right font-bold text-slate-900">{formatCurrency(item.totalPrice)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-dashed border-slate-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Subtotal (Excl. GST)</span>
                    <span className="font-medium text-slate-900">{formatCurrency(completedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Total GST</span>
                    <span className="font-medium text-slate-900">{formatCurrency(completedOrder.totalGst)}</span>
                  </div>
                  {completedOrder.billDiscountAmount && completedOrder.billDiscountAmount > 0 ? (
                    <div className="flex justify-between text-sm text-rose-600">
                      <span>Discount ({completedOrder.billDiscountType === 'PERCENT' ? `${completedOrder.billDiscountAmount}%` : 'Fixed'})</span>
                      <span className="font-medium">-{formatCurrency(
                        completedOrder.billDiscountType === 'PERCENT' 
                          ? (completedOrder.subtotal + completedOrder.totalGst) * (completedOrder.billDiscountAmount / 100)
                          : completedOrder.billDiscountAmount
                      )}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between text-xl font-black pt-2 text-slate-900">
                    <span>TOTAL</span>
                    <span>{formatCurrency(completedOrder.totalAmount)}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      {completedOrder.paymentMethod === 'CASH' && <Banknote className="w-4 h-4 text-emerald-600" />}
                      {completedOrder.paymentMethod === 'UPI' && <Smartphone className="w-4 h-4 text-slate-600" />}
                      {completedOrder.paymentMethod === 'CARD' && <CreditCard className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Paid via</p>
                      <p className="text-sm font-bold text-slate-900">{completedOrder.paymentMethod}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Status</p>
                    <p className="text-sm font-bold text-emerald-600">{completedOrder.paymentStatus}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 flex gap-3">
                <button 
                  onClick={() => window.print()}
                  className="flex-1 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 flex items-center justify-center gap-2 hover:bg-slate-100 transition-all"
                >
                  <Printer className="w-5 h-5" />
                  Print Invoice
                </button>
                <button 
                  onClick={() => setCompletedOrder(null)}
                  className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
                >
                  New Order
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
