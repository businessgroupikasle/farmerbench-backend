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
} from 'lucide-react';
import './CartPage.css';
import './CheckoutPage.css';

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
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!phone.trim() || cleanPhone.length < 10) {
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

  const handlePaymentAndPlaceOrder = async () => {
    setErrorMsg(null);

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setIsProcessing(true);

    try {
      const shippingAddress = getCombinedShippingAddress();

      // 1. Create order in Backend database (Initial status: PENDING)
      const orderRes = await orderService.createOrder({
        shippingAddress,
        paymentMethod,
      });

      if (!orderRes.success || !orderRes.data) {
        throw new Error(orderRes.message || 'Failed to initialize order');
      }

      const createdOrder = orderRes.data;

      // 2. If Razorpay is chosen, open the official Razorpay Checkout SDK
      if (paymentMethod === 'RAZORPAY') {
        const isLoaded = await loadRazorpayCheckout();
        if (!isLoaded || typeof window.Razorpay !== 'function') {
          throw new Error('Razorpay payment gateway failed to load. Please check your internet connection.');
        }

        const rzpRes = await paymentService.createRazorpayOrder(createdOrder.id);
        if (!rzpRes.success || !rzpRes.data) {
          throw new Error(rzpRes.message || 'Failed to create Razorpay payment order');
        }

        const rzpData = rzpRes.data;

        const options = {
          key: rzpData.keyId,
          amount: rzpData.amount,
          currency: rzpData.currency || 'INR',
          name: 'FarmerBench Agri Commerce',
          description: \`Payment for Order #\${createdOrder.id.slice(0, 8)}\`,
          order_id: rzpData.razorpayOrderId,
          prefill: {
            name: fullName.trim(),
            email: user?.email || '',
            contact: phone.trim(),
          },
          theme: {
            color: '#15803D',
          },
          handler: async (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) => {
            try {
              setIsProcessing(true);
              await paymentService.verifyPayment({
                orderId: createdOrder.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              clearCart();
              queryClient.invalidateQueries({ queryKey: ['orders'] });
              queryClient.invalidateQueries({ queryKey: ['cart'] });
              queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
              queryClient.invalidateQueries({ queryKey: ['products'] });

              addToast({ type: 'success', message: 'Payment successful! Order confirmed.' });
              navigate(\`/order-confirmation/\${createdOrder.id}\`);
            } catch (verifyErr: any) {
              console.error('Payment verification error:', verifyErr);
              setErrorMsg(verifyErr.message || 'Payment verification failed.');
              addToast({ type: 'error', message: verifyErr.message || 'Payment verification failed' });
              setIsProcessing(false);
            }
          },
          modal: {
            ondismiss: () => {
              setIsProcessing(false);
              addToast({ type: 'info', message: 'Payment window closed. You can retry payment.' });
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (failResponse: any) => {
          const errorDescription =
            failResponse?.error?.description ||
            failResponse?.error?.reason ||
            'Payment failed. Please retry.';
          setErrorMsg(errorDescription);
          addToast({ type: 'error', message: errorDescription });
          setIsProcessing(false);
        });
        rzp.open();
        return;
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
    <div className="checkout-page-container">
      {/* 1. Breadcrumb */}
      <nav className="checkout-breadcrumb" aria-label="Breadcrumb">
        <Link to="/" className="checkout-breadcrumb-link">
          Home
        </Link>
        <span className="checkout-breadcrumb-separator">/</span>
        <Link to="/cart" className="checkout-breadcrumb-link">
          Shopping Cart
        </Link>
        <span className="checkout-breadcrumb-separator">/</span>
        <span className="checkout-breadcrumb-current">Checkout & Payment</span>
      </nav>

      {/* 2. Stepper Progress Bar */}
      <div className="checkout-stepper-wrapper">
        <div className="checkout-stepper">
          {/* Step 1: Cart */}
          <div className="checkout-step done">
            <div className="checkout-step-circle">
              <Check size={16} strokeWidth={3} />
            </div>
            <span className="checkout-step-label">Cart</span>
          </div>

          <div className="checkout-step-line done" />

          {/* Step 2: Delivery */}
          <div className={\`checkout-step \${step >= 1 ? (step > 1 ? 'done' : 'active') : ''}\`}>
            <div className="checkout-step-circle">
              {step > 1 ? <Check size={16} strokeWidth={3} /> : '2'}
            </div>
            <span className="checkout-step-label">Delivery</span>
          </div>

          <div className={\`checkout-step-line \${step > 1 ? 'done' : ''}\`} />

          {/* Step 3: Payment */}
          <div className={\`checkout-step \${step === 2 ? 'active' : ''}\`}>
            <div className="checkout-step-circle">3</div>
            <span className="checkout-step-label">Payment</span>
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
      <div className="checkout-grid">
        {/* Left Column: Multi-Step Forms */}
        <div>
          {step === 1 ? (
            /* ================= STEP 1: DELIVERY ADDRESS ================= */
            <div className="checkout-card">
              <div className="checkout-card-header">
                <div className="checkout-card-icon-wrap">
                  <MapPin size={22} />
                </div>
                <div>
                  <h2 className="checkout-card-title">Delivery Address</h2>
                  <p className="checkout-card-subtitle">
                    Enter farm gate / residential address for verified dispatch
                  </p>
                </div>
              </div>

              <form onSubmit={handleAddressSubmit} className="checkout-form">
                {/* Full Name & Phone */}
                <div className="checkout-form-row-2">
                  <div className="checkout-field">
                    <label className="checkout-label">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ponraj Krishnan"
                      className="checkout-input"
                    />
                  </div>
                  <div className="checkout-field">
                    <label className="checkout-label">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="checkout-input"
                    />
                  </div>
                </div>

                {/* Address Line 1 */}
                <div className="checkout-field">
                  <label className="checkout-label">Address Line 1 (House/Farm No, Street, Landmark) *</label>
                  <input
                    type="text"
                    required
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="e.g. No. 42, Green Valley Farms, Trichy Main Road"
                    className="checkout-input"
                  />
                </div>

                {/* Address Line 2 */}
                <div className="checkout-field">
                  <label className="checkout-label">Address Line 2 (Area, Village, Post - Optional)</label>
                  <input
                    type="text"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    placeholder="e.g. Near Panchayat Union Office"
                    className="checkout-input"
                  />
                </div>

                {/* City, State, Pincode */}
                <div className="checkout-form-row-3">
                  <div className="checkout-field">
                    <label className="checkout-label">City / Town *</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Thanjavur"
                      className="checkout-input"
                    />
                  </div>
                  <div className="checkout-field">
                    <label className="checkout-label">State *</label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="checkout-select"
                    >
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Kerala">Kerala</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Andhra Pradesh">Andhra Pradesh</option>
                      <option value="Telangana">Telangana</option>
                      <option value="Maharashtra">Maharashtra</option>
                    </select>
                  </div>
                  <div className="checkout-field">
                    <label className="checkout-label">Pincode *</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="613001"
                      className="checkout-input"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="checkout-field">
                  <label className="checkout-label">Special Delivery / Farm Gate Instructions (Optional)</label>
                  <textarea
                    rows={2}
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="e.g. Call before arrival, deliver near main drip borewell gate"
                    className="checkout-textarea"
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {/* Submit CTA */}
                <div className="checkout-actions-row">
                  <Link to="/cart" className="checkout-back-btn">
                    <ChevronLeft size={18} /> Return to Cart
                  </Link>

                  <button type="submit" className="checkout-submit-btn">
                    <span>Proceed to Payment</span>
                    <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* ================= STEP 2: PAYMENT METHOD ================= */
            <div className="checkout-card">
              <div className="checkout-card-header" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div className="checkout-card-icon-wrap">
                    <CreditCard size={22} />
                  </div>
                  <div>
                    <h2 className="checkout-card-title">Payment Option</h2>
                    <p className="checkout-card-subtitle">
                      Choose your preferred payment method
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="checkout-edit-btn"
                >
                  <ChevronLeft size={14} /> Edit Address
                </button>
              </div>

              {/* Delivery Summary Badge */}
              <div className="checkout-deliver-summary">
                <div>
                  <span className="checkout-deliver-label">DELIVER TO:</span>
                  <p className="checkout-deliver-name">
                    {fullName} (+91{phone.replace(/^(\\+91|91|0)/, '')})
                  </p>
                  <p className="checkout-deliver-address">
                    {addressLine1}, {city}, {state} - {pincode}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="checkout-edit-btn"
                >
                  Change
                </button>
              </div>

              {/* Payment Methods */}
              <div className="checkout-payment-options">
                {/* 1. RAZORPAY */}
                <label
                  className={\`checkout-payment-card \${paymentMethod === 'RAZORPAY' ? 'active' : ''}\`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="RAZORPAY"
                    checked={paymentMethod === 'RAZORPAY'}
                    onChange={() => setPaymentMethod('RAZORPAY')}
                    className="checkout-radio"
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1E293B' }}>
                          Razorpay Secure Payment
                        </span>
                        <span className="checkout-badge-pill">
                          Recommended
                        </span>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#4B5563', margin: '0 0 0.75rem', lineHeight: 1.4 }}>
                      Instant confirmation via UPI (Google Pay, PhonePe, Paytm), Net Banking (SBI, HDFC, ICICI), Cards & Wallets.
                    </p>

                    {/* Indian Payment Logos / Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {['UPI / QR', 'Google Pay', 'PhonePe', 'Paytm', 'RuPay', 'Visa / MC', 'NetBanking'].map((b) => (
                        <span key={b} className="checkout-method-tag">
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                </label>

                {/* 2. CASH ON DELIVERY */}
                <label
                  className={\`checkout-payment-card \${paymentMethod === 'CASH_ON_DELIVERY' ? 'active' : ''}\`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CASH_ON_DELIVERY"
                    checked={paymentMethod === 'CASH_ON_DELIVERY'}
                    onChange={() => setPaymentMethod('CASH_ON_DELIVERY')}
                    className="checkout-radio"
                  />
                  <div>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1E293B' }}>
                      Cash on Delivery (COD)
                    </span>
                    <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.3rem 0 0', lineHeight: 1.4 }}>
                      Pay in cash directly to delivery associate upon arrival at your farm gate or address.
                    </p>
                  </div>
                </label>
              </div>

              {/* Place Order CTA Button */}
              <div className="checkout-actions-row">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="checkout-back-btn"
                >
                  <ArrowLeft size={16} /> Back
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handlePaymentAndPlaceOrder}
                  className="checkout-submit-btn"
                  style={{ flex: 1 }}
                >
                  {isProcessing ? (
                    <span>Connecting to Razorpay...</span>
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
    </div>
  );
};

export default CheckoutPage;
`;

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Successfully updated CheckoutPage.tsx with pure official Razorpay SDK integration (Zero UI changes).');
