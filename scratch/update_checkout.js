const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../farmer_frontend/src/pages/CheckoutPage.tsx');

const content = `import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { useUIStore } from '../store/uiStore';
import { orderService } from '../services/order.service';
import { paymentService } from '../services/payment.service';
import { ShippingAddress, PaymentMethod } from '@formerbench/shared';
import { useQueryClient } from '@tanstack/react-query';
import {
  Truck,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Check,
  Lock,
  ArrowLeft,
  MapPin,
  ChevronLeft,
  AlertCircle,
  Smartphone,
  Building2,
} from 'lucide-react';
import './CartPage.css';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

const loadRazorpayCheckout = (): Promise<boolean> => {
  if (typeof window.Razorpay === 'function') return Promise.resolve(true);

  return new Promise((resolve) => {
    const staleScript = document.getElementById('razorpay-checkout-script');
    staleScript?.remove();

    const script = document.createElement('script');
    script.id = 'razorpay-checkout-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(typeof window.Razorpay === 'function');
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { items, subtotal, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { addToast } = useUIStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Address State
  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState(user?.location || 'Thanjavur');
  const [state, setState] = useState('Tamil Nadu');
  const [pincode, setPincode] = useState('613001');
  const [orderNotes, setOrderNotes] = useState('');

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('RAZORPAY');

  // Simulation Modal State
  const [simModalOpen, setSimModalOpen] = useState(false);
  const [simOrderData, setSimOrderData] = useState<{
    orderId: string;
    razorpayOrderId: string;
    amount: number;
  } | null>(null);
  const [simMethodTab, setSimMethodTab] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [simUpiId, setSimUpiId] = useState('farmer@okaxis');
  const [simCardNumber, setSimCardNumber] = useState('4111 2222 3333 4444');

  // Calculations
  const freeDeliveryThreshold = 999;
  const isFreeDelivery = subtotal >= freeDeliveryThreshold;
  const deliveryFee = isFreeDelivery || items.length === 0 ? 0 : 80;
  const grandTotal = subtotal + deliveryFee;

  // Load Razorpay script dynamically
  useEffect(() => {
    void loadRazorpayCheckout();
  }, []);

  if (items.length === 0) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '2rem' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#F0FDF4',
            color: '#15803D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}
        >
          <Truck size={32} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F4726', marginBottom: '0.75rem' }}>
          Your Cart is Empty
        </h2>
        <p style={{ color: '#64748B', marginBottom: '2rem' }}>
          Please add products to your cart before proceeding to checkout.
        </p>
        <Link to="/products" className="cart-footer-continue-btn">
          Browse Farm Products
        </Link>
      </div>
    );
  }

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }
    if (!phone.trim() || phone.replace(/[^0-9]/g, '').length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!addressLine1.trim()) {
      setErrorMsg('Please enter Address Line 1 (House/Building/Street)');
      return;
    }
    if (!city.trim()) {
      setErrorMsg('Please enter City/Town');
      return;
    }
    if (!state.trim()) {
      setErrorMsg('Please enter State');
      return;
    }
    if (!pincode.trim() || pincode.trim().length < 6) {
      setErrorMsg('Please enter a valid 6-digit Pincode');
      return;
    }

    // Advance to Payment Step
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getCombinedShippingAddress = (): ShippingAddress => {
    const fullStreet = addressLine2.trim()
      ? \`\${addressLine1.trim()}, \${addressLine2.trim()}\`
      : addressLine1.trim();

    return {
      fullName: fullName.trim(),
      street: fullStreet,
      city: city.trim(),
      state: state.trim(),
      postalCode: pincode.trim(),
      country: 'India',
      phone: phone.trim(),
    };
  };

  const completeSuccessfulPayment = async (orderId: string, paymentId: string, rzpOrderId: string, signature: string) => {
    try {
      setIsProcessing(true);
      await paymentService.verifyPayment({
        orderId,
        razorpay_order_id: rzpOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      });

      // Clear local and server cart & invalidate queries for instant sync
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });

      addToast({ type: 'success', message: 'Payment successful! Order confirmed.' });
      setSimModalOpen(false);
      navigate(\`/order-confirmation/\${orderId}\`);
    } catch (err: any) {
      console.error('Verification error:', err);
      addToast({ type: 'error', message: err.message || 'Payment verification failed' });
      setErrorMsg(err.message || 'Payment verification failed');
      setIsProcessing(false);
    }
  };

  const handlePaymentAndPlaceOrder = async () => {
    setErrorMsg(null);

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setIsProcessing(true);

    try {
      const shippingAddress = getCombinedShippingAddress();

      // 1. Create order in Backend database
      const orderRes = await orderService.createOrder({
        shippingAddress,
        paymentMethod,
      });

      if (!orderRes.success || !orderRes.data) {
        throw new Error(orderRes.message || 'Failed to initialize order');
      }

      const createdOrder = orderRes.data;

      // 2. If Razorpay is chosen, initiate transaction
      if (paymentMethod === 'RAZORPAY') {
        const rzpRes = await paymentService.createRazorpayOrder(createdOrder.id);

        if (!rzpRes.success || !rzpRes.data) {
          throw new Error(rzpRes.message || 'Failed to initiate Razorpay transaction');
        }

        const rzpData = rzpRes.data;
        const isSim = (rzpData as any).isSimulation || rzpData.razorpayOrderId.startsWith('order_sim_') || !rzpData.keyId || rzpData.keyId === 'rzp_test_demo_key';

        // A. If live Razorpay keys are configured and valid, open official Razorpay Checkout SDK
        if (!isSim && typeof window.Razorpay === 'function') {
          const options = {
            key: rzpData.keyId,
            amount: rzpData.amount,
            currency: rzpData.currency || 'INR',
            name: 'FarmerBench Agri Commerce',
            description: \`Payment for Order #\${createdOrder.id.slice(0, 8)}\`,
            order_id: rzpData.razorpayOrderId,
            prefill: {
              name: fullName,
              email: user?.email || '',
              contact: phone,
            },
            theme: {
              color: '#15803D',
            },
            handler: async (response: any) => {
              await completeSuccessfulPayment(
                createdOrder.id,
                response.razorpay_payment_id || \`pay_\${Date.now()}\`,
                response.razorpay_order_id || rzpData.razorpayOrderId,
                response.razorpay_signature || ''
              );
            },
            modal: {
              ondismiss: () => {
                setIsProcessing(false);
                addToast({ type: 'info', message: 'Payment popup closed. You can retry payment.' });
              },
            },
          };

          const rzpInstance = new window.Razorpay(options);
          rzpInstance.on('payment.failed', (response: any) => {
            const reason = response?.error?.description || 'Payment failed. Please retry.';
            setErrorMsg(reason);
            addToast({ type: 'error', message: reason });
            setIsProcessing(false);
          });
          rzpInstance.open();
          return;
        }

        // B. If running in smart test sandbox simulation mode, open Interactive Sandbox Gateway
        setIsProcessing(false);
        setSimOrderData({
          orderId: createdOrder.id,
          razorpayOrderId: rzpData.razorpayOrderId,
          amount: rzpData.amount,
        });
        setSimModalOpen(true);
      } else {
        // Cash on Delivery
        clearCart();
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['cart'] });
        queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
        addToast({ type: 'success', message: 'Order placed successfully with Cash on Delivery!' });
        navigate(\`/order-confirmation/\${createdOrder.id}\`);
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMsg(err.message || 'An error occurred during checkout. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* 1. Breadcrumb */}
      <nav className="cart-breadcrumb" aria-label="Breadcrumb">
        <Link to="/" className="cart-breadcrumb-link">
          Home
        </Link>
        <span className="cart-breadcrumb-separator">/</span>
        <Link to="/cart" className="cart-breadcrumb-link">
          Shopping Cart
        </Link>
        <span className="cart-breadcrumb-separator">/</span>
        <span className="cart-breadcrumb-current">Checkout & Payment</span>
      </nav>

      {/* 2. Stepper Progress Bar */}
      <div className="cart-stepper-container">
        <div className="cart-stepper">
          {/* Step 1: Cart */}
          <div className="cart-step done">
            <div className="cart-step-circle">
              <Check size={16} strokeWidth={3} />
            </div>
            <span className="cart-step-label">Cart</span>
          </div>
          <div className="cart-step-line done" />

          {/* Step 2: Delivery */}
          <div className={\`cart-step \${step >= 1 ? (step > 1 ? 'done' : 'active') : ''}\`}>
            <div className="cart-step-circle">
              {step > 1 ? <Check size={16} strokeWidth={3} /> : '2'}
            </div>
            <span className="cart-step-label">Delivery</span>
          </div>
          <div className={\`cart-step-line \${step > 1 ? 'done' : ''}\`} />

          {/* Step 3: Payment */}
          <div className={\`cart-step \${step === 2 ? 'active' : ''}\`}>
            <div className="cart-step-circle">3</div>
            <span className="cart-step-label">Payment</span>
          </div>
        </div>
      </div>

      {/* Error Alert Banner */}
      {errorMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem 1.25rem',
            backgroundColor: '#FEF2F2',
            border: '1px solid #F87171',
            borderRadius: '12px',
            color: '#B91C1C',
            fontSize: '0.9rem',
          }}
        >
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Left Form, Right Summary */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 380px',
          gap: '2rem',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Multi-Step Forms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {step === 1 ? (
            /* ================= STEP 1: DELIVERY ADDRESS ================= */
            <form onSubmit={handleAddressSubmit} className="cart-shipping-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: '#F0FDF4',
                    color: '#15803D',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MapPin size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F4726', margin: 0 }}>
                    Delivery Address
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
                    Enter farm gate / residential address for verified dispatch
                  </p>
                </div>
              </div>

              {/* Form Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="cart-input-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ponraj Krishnan"
                    className="cart-input"
                  />
                </div>
                <div>
                  <label className="cart-input-label">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="cart-input"
                  />
                </div>
              </div>

              <div>
                <label className="cart-input-label">Address Line 1 (House/Farm No, Street, Landmark) *</label>
                <input
                  type="text"
                  required
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="e.g. No. 42, Green Valley Farms, Trichy Main Road"
                  className="cart-input"
                />
              </div>

              <div>
                <label className="cart-input-label">Address Line 2 (Area, Village, Post - Optional)</label>
                <input
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="e.g. Near Panchayat Union Office"
                  className="cart-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="cart-input-label">City / Town *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Thanjavur"
                    className="cart-input"
                  />
                </div>
                <div>
                  <label className="cart-input-label">State *</label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="cart-input"
                    style={{ backgroundColor: '#ffffff' }}
                  >
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Kerala">Kerala</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Maharashtra">Maharashtra</option>
                  </select>
                </div>
                <div>
                  <label className="cart-input-label">Pincode *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="613001"
                    className="cart-input"
                  />
                </div>
              </div>

              <div>
                <label className="cart-input-label">Special Delivery / Farm Gate Instructions (Optional)</label>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="e.g. Call before arrival, deliver near main drip borewell gate"
                  className="cart-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Submit CTA */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <Link
                  to="/cart"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    color: '#64748B',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                >
                  <ChevronLeft size={16} /> Return to Cart
                </Link>

                <button type="submit" className="cart-checkout-btn" style={{ margin: 0, padding: '0.85rem 1.75rem' }}>
                  <span>Proceed to Payment</span>
                  <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
                </button>
              </div>
            </form>
          ) : (
            /* ================= STEP 2: PAYMENT METHOD ================= */
            <div className="cart-shipping-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: '#F0FDF4',
                      color: '#15803D',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F4726', margin: 0 }}>
                      Payment Option
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
                      Choose your preferred payment method
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#15803D',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                  }}
                >
                  <ChevronLeft size={14} /> Edit Address
                </button>
              </div>

              {/* Delivery Summary Badge */}
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  fontSize: '0.85rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Deliver To:
                  </span>
                  <p style={{ margin: '0.2rem 0 0', fontWeight: 700, color: '#1E293B' }}>
                    {fullName} (+91{phone.replace(/^(\\+91|91|0)/, '')})
                  </p>
                  <p style={{ margin: '0.1rem 0 0', color: '#64748B', fontSize: '0.8rem' }}>
                    {addressLine1}, {city}, {state} - {pincode}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Change
                </button>
              </div>

              {/* Payment Methods */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {/* 1. RAZORPAY */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    padding: '1.25rem',
                    borderRadius: '14px',
                    border: paymentMethod === 'RAZORPAY' ? '2px solid #15803D' : '1px solid #E2E8F0',
                    backgroundColor: paymentMethod === 'RAZORPAY' ? '#F0FDF4' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="RAZORPAY"
                    checked={paymentMethod === 'RAZORPAY'}
                    onChange={() => setPaymentMethod('RAZORPAY')}
                    style={{ accentColor: '#15803D', marginTop: '0.25rem', width: '18px', height: '18px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: '#1E293B' }}>
                          Razorpay Secure Payment
                        </span>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '999px',
                            backgroundColor: '#DCFCE7',
                            color: '#15803D',
                          }}
                        >
                          Recommended
                        </span>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#4B5563', margin: '0 0 0.75rem' }}>
                      Instant confirmation via UPI (Google Pay, PhonePe, Paytm), Net Banking (SBI, HDFC, ICICI), Cards & Wallets.
                    </p>

                    {/* Indian Payment Logos / Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {['UPI / QR', 'Google Pay', 'PhonePe', 'Paytm', 'RuPay', 'Visa / MC', 'NetBanking'].map((b) => (
                        <span
                          key={b}
                          style={{
                            fontSize: '0.725rem',
                            fontWeight: 600,
                            padding: '0.25rem 0.55rem',
                            backgroundColor: '#ffffff',
                            border: '1px solid #CBD5E1',
                            borderRadius: '6px',
                            color: '#334155',
                          }}
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                </label>

                {/* 2. CASH ON DELIVERY */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    padding: '1.25rem',
                    borderRadius: '14px',
                    border: paymentMethod === 'CASH_ON_DELIVERY' ? '2px solid #15803D' : '1px solid #E2E8F0',
                    backgroundColor: paymentMethod === 'CASH_ON_DELIVERY' ? '#F0FDF4' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CASH_ON_DELIVERY"
                    checked={paymentMethod === 'CASH_ON_DELIVERY'}
                    onChange={() => setPaymentMethod('CASH_ON_DELIVERY')}
                    style={{ accentColor: '#15803D', marginTop: '0.25rem', width: '18px', height: '18px' }}
                  />
                  <div>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: '#1E293B' }}>
                      Cash on Delivery (COD)
                    </span>
                    <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.2rem 0 0' }}>
                      Pay in cash directly to delivery associate upon arrival at your farm gate or address.
                    </p>
                  </div>
                </label>
              </div>

              {/* Place Order CTA Button */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    padding: '0.85rem 1.25rem',
                    borderRadius: '12px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <ArrowLeft size={16} /> Back
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handlePaymentAndPlaceOrder}
                  className="cart-checkout-btn"
                  style={{ flex: 1, margin: 0 }}
                >
                  {isProcessing ? (
                    <span>Processing Payment...</span>
                  ) : paymentMethod === 'RAZORPAY' ? (
                    <>
                      <span>Pay ₹{grandTotal.toFixed(2)} via Razorpay</span>
                      <Lock size={17} />
                    </>
                  ) : (
                    <>
                      <span>Confirm COD Order (₹{grandTotal.toFixed(2)})</span>
                      <CheckCircle2 size={17} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sticky Column: Order Summary */}
        <div style={{ position: 'sticky', top: '100px' }}>
          <div className="cart-summary-card">
            <h2 className="cart-summary-title">Order Items ({items.length})</h2>

            {/* Items mini list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '240px', overflowY: 'auto', marginBottom: '1rem', paddingRight: '0.25rem' }}>
              {items.map((item) => {
                const p = item.product || {};
                const price = p.discountPrice ?? p.price ?? 0;
                const img = p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600';
                return (
                  <div key={item.id || item.productId} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img
                      src={img}
                      alt={p.title}
                      style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #E2E8F0' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E293B', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.title || 'Product'}
                      </p>
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        Qty: {item.quantity} × ₹{price.toFixed(2)}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B' }}>
                      ₹{(price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Price Line Items */}
            <div className="cart-summary-lines">
              <div className="cart-summary-row">
                <span className="cart-summary-label">Items Subtotal</span>
                <span className="cart-summary-val">₹{subtotal.toFixed(2)}</span>
              </div>

              <div className="cart-summary-row">
                <span className="cart-summary-label">Delivery Charges</span>
                <span className="cart-summary-val" style={{ color: isFreeDelivery ? '#15803D' : undefined }}>
                  {isFreeDelivery ? 'FREE' : \`₹\${deliveryFee.toFixed(2)}\`}
                </span>
              </div>

              <div className="cart-summary-row total">
                <span className="cart-summary-total-label">Total Payable</span>
                <span className="cart-summary-total-val">₹{grandTotal.toFixed(2)}</span>
              </div>
              <span className="cart-tax-notice">Includes GST and all farm tax exemptions</span>
            </div>

            {/* Safe & Secure Guarantee Badges */}
            <div className="cart-trust-badges" style={{ marginTop: '1.25rem' }}>
              <div className="cart-trust-item">
                <ShieldCheck size={16} className="cart-trust-icon" />
                <span>256-Bit SSL Razorpay Certified Gateway</span>
              </div>
              <div className="cart-trust-item">
                <Truck size={16} className="cart-trust-icon" />
                <span>Direct Farm Gate Dispatch in 24-48 Hours</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= RAZORPAY TEST SANDBOX SIMULATION MODAL ================= */}
      {simModalOpen && simOrderData && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                backgroundColor: '#0F4726',
                color: '#ffffff',
                padding: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em', backgroundColor: 'rgba(255,255,255,0.2)', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                    RAZORPAY TEST GATEWAY
                  </span>
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0.25rem 0' }}>
                  FarmerBench Agri Commerce
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#BBF7D0' }}>
                  Order ID: #{simOrderData.orderId.slice(0, 8)}
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: '#BBF7D0' }}>Amount to Pay</span>
                <p style={{ margin: '0.1rem 0 0', fontSize: '1.4rem', fontWeight: 800 }}>
                  ₹{(simOrderData.amount / 100).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Modal Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
              <button
                type="button"
                onClick={() => setSimMethodTab('upi')}
                style={{
                  flex: 1,
                  padding: '0.85rem 0.5rem',
                  border: 'none',
                  background: simMethodTab === 'upi' ? '#ffffff' : 'transparent',
                  fontWeight: simMethodTab === 'upi' ? 700 : 500,
                  color: simMethodTab === 'upi' ? '#15803D' : '#64748B',
                  borderBottom: simMethodTab === 'upi' ? '2px solid #15803D' : 'none',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                <Smartphone size={16} /> UPI / QR
              </button>
              <button
                type="button"
                onClick={() => setSimMethodTab('card')}
                style={{
                  flex: 1,
                  padding: '0.85rem 0.5rem',
                  border: 'none',
                  background: simMethodTab === 'card' ? '#ffffff' : 'transparent',
                  fontWeight: simMethodTab === 'card' ? 700 : 500,
                  color: simMethodTab === 'card' ? '#15803D' : '#64748B',
                  borderBottom: simMethodTab === 'card' ? '2px solid #15803D' : 'none',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                <CreditCard size={16} /> Card
              </button>
              <button
                type="button"
                onClick={() => setSimMethodTab('netbanking')}
                style={{
                  flex: 1,
                  padding: '0.85rem 0.5rem',
                  border: 'none',
                  background: simMethodTab === 'netbanking' ? '#ffffff' : 'transparent',
                  fontWeight: simMethodTab === 'netbanking' ? 700 : 500,
                  color: simMethodTab === 'netbanking' ? '#15803D' : '#64748B',
                  borderBottom: simMethodTab === 'netbanking' ? '2px solid #15803D' : 'none',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                <Building2 size={16} /> NetBanking
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {simMethodTab === 'upi' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {['Google Pay', 'PhonePe', 'Paytm', 'BHIM UPI'].map((app) => (
                      <span
                        key={app}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          backgroundColor: '#F8FAFC',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: '#334155',
                        }}
                      >
                        {app}
                      </span>
                    ))}
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.3rem' }}>
                      UPI ID / VPA
                    </label>
                    <input
                      type="text"
                      value={simUpiId}
                      onChange={(e) => setSimUpiId(e.target.value)}
                      className="cart-input"
                      placeholder="e.g. mobile@upi"
                    />
                  </div>
                </div>
              )}

              {simMethodTab === 'card' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.3rem' }}>
                      Card Number (Test Simulation)
                    </label>
                    <input
                      type="text"
                      value={simCardNumber}
                      onChange={(e) => setSimCardNumber(e.target.value)}
                      className="cart-input"
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.3rem' }}>
                        Expiry (MM/YY)
                      </label>
                      <input type="text" defaultValue="12/28" className="cart-input" />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.3rem' }}>
                        CVV
                      </label>
                      <input type="password" defaultValue="123" maxLength={3} className="cart-input" />
                    </div>
                  </div>
                </div>
              )}

              {simMethodTab === 'netbanking' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                    Select Popular Bank
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra', 'Punjab National'].map((bank) => (
                      <div
                        key={bank}
                        style={{
                          padding: '0.5rem 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          backgroundColor: '#F8FAFC',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: '#1E293B',
                        }}
                      >
                        {bank}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => {
                    const payId = \`pay_sim_\${Date.now()}_\${Math.floor(Math.random() * 10000)}\`;
                    void completeSuccessfulPayment(
                      simOrderData.orderId,
                      payId,
                      simOrderData.razorpayOrderId,
                      'simulated_valid_signature'
                    );
                  }}
                  style={{
                    backgroundColor: '#15803D',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '0.9rem',
                    fontWeight: 800,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 14px rgba(21, 128, 61, 0.35)',
                  }}
                >
                  <CheckCircle2 size={18} />
                  <span>{isProcessing ? 'Verifying Payment...' : \`Simulate Successful Payment (₹\${(simOrderData.amount / 100).toFixed(2)})\`}</span>
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => {
                    setSimModalOpen(false);
                    setErrorMsg('Payment was cancelled. You can retry anytime.');
                    addToast({ type: 'info', message: 'Payment cancelled.' });
                  }}
                  style={{
                    backgroundColor: '#F1F5F9',
                    color: '#64748B',
                    border: '1px solid #CBD5E1',
                    borderRadius: '12px',
                    padding: '0.65rem',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel / Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
`;

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Successfully updated CheckoutPage.tsx with escaped regex');
