import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Search, 
  ChevronRight, 
  ArrowLeft, 
  MapPin, 
  CreditCard, 
  Truck, 
  CheckCircle2, 
  Loader2,
  Plus,
  Minus,
  X,
  Package,
  Zap,
  History,
  Phone,
  User as UserIcon,
  ShoppingBasket,
  Tag,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { InventoryItem, Order, OrderItem, PromoCode } from '../types';
import { fetchInventoryInsightsData, createOnlineOrder, fetchOrdersByPhone, validatePromoCode } from '../services/api';

interface StorefrontProps {
  onOrderPlace?: (order: Order) => void;
  onGoToTracking?: (orderId: string) => void;
}

const Storefront: React.FC<StorefrontProps> = ({ onOrderPlace, onGoToTracking }) => {
  const [products, setProducts] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<{ product: InventoryItem; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutMode, setIsCheckoutMode] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [orderComplete, setOrderComplete] = useState<Order | null>(null);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [historyPhone, setHistoryPhone] = useState('');
  
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD'>('UPI');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState('');
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await fetchInventoryInsightsData();
      setProducts(data.allInventory.filter(p => p.quantity > 0));
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...Array.from(new Set(products.map(p => 'General')))]; // Simple for now

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: InventoryItem) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.product.sellingPrice * item.quantity), 0);
  const deliveryFee = subtotal > 1000 ? 0 : 50;
  const discount = appliedPromo 
    ? (appliedPromo.type === 'PERCENT' ? (subtotal * appliedPromo.value / 100) : appliedPromo.value)
    : 0;
  const total = Math.max(0, subtotal + deliveryFee - (discount > 0 ? discount : 0));

  const handleApplyPromo = async () => {
    if (!promoCodeInput) return;
    setIsValidatingPromo(true);
    setPromoError('');
    try {
      const promo = await validatePromoCode(promoCodeInput, subtotal);
      if (promo) {
        setAppliedPromo(promo);
        setPromoCodeInput('');
      } else {
        setPromoError('Invalid code or minimum amount not met');
      }
    } catch (err) {
      setPromoError('Error validating code');
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    
    setIsSubmitting(true);
    try {
      const orderItems: OrderItem[] = cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        sku: item.product.sku,
        quantity: item.quantity,
        purchasePrice: item.product.purchasePrice,
        sellingPrice: item.product.sellingPrice,
        gstPercent: item.product.gstPercent,
        totalPrice: item.product.sellingPrice * item.quantity
      }));

      const orderData: Partial<Order> = {
        customer: {
          id: `cust-${Date.now()}`,
          name: customerInfo.name,
          phone: customerInfo.phone,
          email: customerInfo.email,
          totalSpent: total,
          ordersCount: 1,
          outstandingBalance: paymentMethod === 'CASH' ? total : 0,
          loyaltyPoints: Math.floor(total / 100),
          storeCredit: 0
        },
        items: orderItems,
        subtotal,
        totalGst: subtotal * 0.18, // Simplified
        totalAmount: total,
        amountPaid: paymentMethod === 'CASH' ? 0 : total,
        balanceDue: paymentMethod === 'CASH' ? total : 0,
        paymentMethod: paymentMethod,
        deliveryAddress: address,
        branchId: 'b1', // Default
        promoCode: appliedPromo?.code,
        promoDiscount: discount
      };

      const result = await createOnlineOrder(orderData);
      setOrderComplete(result);
      setCart([]);
      if (onOrderPlace) onOrderPlace(result);
    } catch (error) {
      console.error('Checkout failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const handleFetchHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!historyPhone) return;
    setIsSubmitting(true);
    try {
      const data = await fetchOrdersByPhone(historyPhone);
      setHistoryOrders(data);
    } catch (error) {
      console.error('History fetch failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium italic">Loading storefront...</p>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full"
        >
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Order Placed!</h2>
          <p className="text-slate-500 mb-8">
            Your items are being prepared. Order ID: <span className="font-mono font-bold text-emerald-600">{orderComplete.id}</span>
          </p>
          
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8 text-left">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Estimated Delivery</h4>
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="font-bold text-slate-900">Within 48 Hours</p>
                <p className="text-xs text-slate-500">To: {orderComplete.deliveryAddress?.street}, {orderComplete.deliveryAddress?.city}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={() => onGoToTracking?.(orderComplete.id)}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
            >
              Track Order
            </button>
            <button 
              onClick={() => { setOrderComplete(null); setIsCheckoutMode(false); }}
              className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all"
            >
              Continue Shopping
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-slate-900 font-sans selection:bg-emerald-100">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-orange-100/50 px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">RetailCore <span className="text-emerald-600">Shop</span></h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-emerald-600 transition-all uppercase tracking-widest sm:mr-4"
          >
            <History className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">My Orders</span>
          </button>
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-all"
          >
            <ShoppingBag className="w-5 h-5" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Hero / Banner */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="bg-emerald-900 rounded-[2.5rem] p-8 md:p-16 relative overflow-hidden text-white shadow-2xl shadow-emerald-900/20">
          <div className="relative z-10 max-w-xl">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-[0.2em] mb-4">
              <Zap className="w-4 h-4 fill-current" /> Free Delivery above ₹1000
            </div>
            <h2 className="text-4xl md:text-6xl font-bold leading-[1.1] mb-6 tracking-tight">
              Essential Tech & <br /> Lifestyle Curated
            </h2>
            <p className="text-emerald-100/70 text-lg mb-8 max-w-sm font-medium leading-relaxed">
              Order premium inventory directly from our stores with fast doorstep delivery.
            </p>
            <div className="flex items-center gap-4">
               <div className="flex -space-x-3">
                 {[1,2,3,4].map(i => (
                   <img key={i} src={`https://picsum.photos/seed/cust${i}/100/100`} className="w-10 h-10 rounded-full border-2 border-emerald-900" alt="Customer" referrerPolicy="no-referrer" />
                 ))}
               </div>
               <p className="text-xs font-bold text-emerald-300">Trusted by 2k+ locals</p>
            </div>
          </div>
          {/* Abstract blobs */}
          <div className="absolute top-0 right-0 w-[500px] h-full translate-x-1/2 opacity-20 pointer-events-none">
            <div className="absolute inset-0 bg-emerald-400 blur-[100px] rounded-full scale-110" />
            <div className="absolute inset-0 bg-orange-400 blur-[100px] rounded-full rotate-45 translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* Product Section */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 pb-32">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-6 py-2 rounded-xl text-xs font-bold transition-all",
                  selectedCategory === cat ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative group max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text"
              placeholder="Search local inventory..."
              className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm shadow-slate-100"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredProducts.map(product => (
            <motion.div 
              layoutId={product.id}
              key={product.id} 
              className="group bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500 flex flex-col"
            >
              <div className="aspect-[4/5] relative bg-slate-50 overflow-hidden">
                <img 
                  src={product.images?.[0] || `https://picsum.photos/seed/${product.sku}/800/1000`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  alt={product.name}
                  referrerPolicy="no-referrer"
                />
                <button 
                  onClick={() => addToCart(product)}
                  className="absolute bottom-4 right-4 w-12 h-12 bg-white text-slate-900 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:bg-emerald-600 hover:text-white sm:translate-y-12 sm:opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
                >
                  <Plus className="w-5 h-5" />
                </button>
                {product.status === 'low-stock' && (
                  <div className="absolute top-4 left-4 px-2 py-1 bg-orange-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-md">
                    Few Left
                  </div>
                )}
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">General</p>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight mb-2 group-hover:text-emerald-600 transition-colors">{product.name}</h3>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-2xl font-black text-slate-900">{formatCurrency(product.sellingPrice)}</span>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                    <Package className="w-3 h-3" />
                    {product.quantity} In Stock
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  < ShoppingBag className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900">Your Cart</h3>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-900 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <ShoppingBag className="w-16 h-16 opacity-10 mb-4" />
                    <p className="italic font-medium">Your cart is empty.</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.product.id} className="flex gap-4 group">
                      <div className="w-20 h-20 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0">
                        <img 
                          src={item.product.images?.[0] || `https://picsum.photos/seed/${item.product.sku}/200/200`}
                          className="w-full h-full object-cover"
                          alt={item.product.name}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{item.product.name}</h4>
                        <p className="text-emerald-600 font-bold text-xs mb-3">{formatCurrency(item.product.sellingPrice)}</p>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center bg-slate-100 rounded-lg p-1">
                            <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1 hover:bg-white rounded-md text-slate-500 transition-all"><Minus className="w-3 h-3" /></button>
                            <span className="w-8 text-center text-xs font-bold text-slate-900">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1 hover:bg-white rounded-md text-slate-500 transition-all"><Plus className="w-3 h-3" /></button>
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-[10px] font-bold text-rose-500 uppercase tracking-widest hover:text-rose-700 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Subtotal</span>
                      <span className="font-bold text-slate-900">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Delivery</span>
                      <span className="font-bold text-emerald-600">{deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between">
                      <span className="font-bold text-slate-900">Total</span>
                      <span className="text-xl font-black text-slate-900">{formatCurrency(total)}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setIsCartOpen(false); setIsCheckoutMode(true); }}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                  >
                    Proceed to Checkout <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Checkout Sidebar/Overlay */}
      <AnimatePresence>
        {isCheckoutMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col md:flex-row overflow-hidden"
            >
              {/* Checkout Form */}
              <div className="flex-1 overflow-y-auto p-8 md:p-12">
                <button 
                  onClick={() => setIsCheckoutMode(false)}
                  className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-bold text-xs uppercase tracking-widest mb-8 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Go Back
                </button>

                <h2 className="text-3xl font-bold text-slate-900 mb-8">Secure Checkout</h2>

                <form onSubmit={handlePlaceOrder} className="space-y-8">
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <UserIcon className="w-4 h-4 text-emerald-500" />
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Contact Information</h4>
                    </div>
                    <div className="space-y-4">
                      <input 
                        type="text" required placeholder="Full Name"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:outline-none"
                        value={customerInfo.name}
                        onChange={e => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input 
                          type="tel" required placeholder="Phone Number"
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:outline-none"
                          value={customerInfo.phone}
                          onChange={e => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                        />
                        <input 
                          type="email" placeholder="Email (Optional)"
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:outline-none"
                          value={customerInfo.email}
                          onChange={e => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-emerald-500" />
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Delivery Address</h4>
                    </div>
                    
                    <div className="space-y-4">
                      <input 
                        type="text" required placeholder="Street Address"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500"
                        value={address.street}
                        onChange={e => setAddress({ ...address, street: e.target.value })}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input 
                          type="text" required placeholder="City"
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:outline-none"
                          value={address.city}
                          onChange={e => setAddress({ ...address, city: e.target.value })}
                        />
                        <input 
                          type="text" required placeholder="Pincode"
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:outline-none"
                          value={address.pincode}
                          onChange={e => setAddress({ ...address, pincode: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="w-4 h-4 text-emerald-500" />
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Payment Method</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { id: 'UPI', label: 'UPI / Scan', icon: Zap },
                        { id: 'CARD', label: 'Credit Card', icon: CreditCard },
                        { id: 'CASH', label: 'Cash on Delivery', icon: Truck }
                      ].map(method => (
                        <button 
                          key={method.id}
                          type="button"
                          onClick={() => setPaymentMethod(method.id as any)}
                          className={cn(
                            "flex flex-col items-center gap-3 p-6 rounded-[1.5rem] border-2 transition-all text-center",
                            paymentMethod === method.id 
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700" 
                              : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"
                          )}
                        >
                          <method.icon className="w-6 h-6" />
                          <span className="text-xs font-bold uppercase tracking-widest">{method.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-5 bg-emerald-600 text-white rounded-[1.5rem] font-bold text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                      </div>
                    ) : `Complete Payment - ${formatCurrency(total)}`}
                  </button>
                </form>
              </div>

              {/* Order Summary Side */}
              <div className="hidden md:flex md:w-[350px] bg-slate-50 p-12 flex-col">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Order Summary</h4>
                <div className="flex-1 space-y-4 overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{item.product.name}</p>
                        <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-bold text-slate-900 whitespace-nowrap">{formatCurrency(item.product.sellingPrice * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-200">
                   <div className="relative group mb-2">
                     <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                     <input 
                       placeholder="Promo Code"
                       className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-20 text-[10px] uppercase font-bold tracking-widest focus:outline-none focus:border-emerald-500 transition-all"
                       value={promoCodeInput}
                       onChange={e => setPromoCodeInput(e.target.value)}
                     />
                     <button 
                       type="button"
                       onClick={handleApplyPromo}
                       disabled={isValidatingPromo || !promoCodeInput}
                       className="absolute right-1 top-1 bottom-1 px-3 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 disabled:opacity-50 transition-all"
                     >
                       {isValidatingPromo ? '...' : 'Apply'}
                     </button>
                   </div>
                   {promoError && <p className="text-[9px] text-rose-500 font-bold ml-1">{promoError}</p>}
                   {appliedPromo && (
                     <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-100 rounded-lg">
                       <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-1">
                         <Check className="w-3 h-3" /> {appliedPromo.code} Applied
                       </p>
                       <button onClick={() => setAppliedPromo(null)} className="text-emerald-400 hover:text-emerald-700 transition-colors">
                         <X className="w-3 h-3" />
                       </button>
                     </div>
                   )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                   <div className="flex justify-between text-sm">
                     <span className="text-slate-500">Subtotal</span>
                     <span className="font-bold text-slate-900">{formatCurrency(subtotal)}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                     <span className="text-slate-500">Delivery</span>
                     <span className="font-bold text-emerald-600">{deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee)}</span>
                   </div>
                   {appliedPromo && (
                     <div className="flex justify-between text-sm">
                       <span className="text-emerald-600 font-bold">Discount</span>
                       <span className="font-bold text-emerald-600">-{formatCurrency(discount)}</span>
                     </div>
                   )}
                   <div className="flex justify-between text-lg font-black text-slate-900 pt-3">
                     <span>Total</span>
                     <span>{formatCurrency(total)}</span>
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* History Drawer */}
      <AnimatePresence>
        {isHistoryOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900">Order History</h3>
                </div>
                <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-900 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 bg-slate-50/50 border-b border-slate-100">
                <p className="text-xs text-slate-500 mb-4">Enter your phone number to see your past orders.</p>
                <form onSubmit={handleFetchHistory} className="flex gap-2">
                  <div className="relative flex-1 group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-all" />
                    <input 
                      type="tel" required placeholder="9876543210"
                      className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition-all"
                      value={historyPhone}
                      onChange={e => setHistoryPhone(e.target.value)}
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                    Find
                  </button>
                </form>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {historyOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 py-20">
                    <Package className="w-12 h-12 opacity-10 mb-4" />
                    <p className="italic text-sm">No orders found.</p>
                  </div>
                ) : (
                  historyOrders.map(order => (
                    <div key={order.id} className="p-4 rounded-2xl border border-slate-100 hover:border-emerald-100 bg-white hover:bg-emerald-50/30 transition-all group">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-xs font-mono font-bold text-emerald-600">{order.id}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{new Date(order.date).toLocaleDateString()}</p>
                        </div>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest",
                          order.fulfillmentStatus === 'DELIVERED' ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
                        )}>
                          {order.fulfillmentStatus}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-900">{formatCurrency(order.totalAmount)}</p>
                        <button 
                          onClick={() => { setIsHistoryOpen(false); onGoToTracking?.(order.id); }}
                          className="flex items-center gap-1 text-[10px] font-bold text-slate-400 group-hover:text-emerald-600 transition-colors uppercase tracking-widest"
                        >
                          Track <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Storefront;
