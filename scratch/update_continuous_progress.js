const fs = require('fs');
const path = require('path');

const frontendSrc = path.resolve(__dirname, '../../farmer_frontend/src');

// 1. Update CartPage.tsx
const cartPageFile = path.join(frontendSrc, 'pages/CartPage.tsx');
let cartContent = fs.readFileSync(cartPageFile, 'utf8');

const oldCartProgress = `{/* 3. Step Checkout Progress Bar */}
      <div className="cart-progress-wrap">
        {/* Step 1: Cart */}
        <div className="cart-step-node">
          <div className="cart-step-circle active">1</div>
          <span className="cart-step-label active">Cart</span>
        </div>

        <div className="cart-step-line" />

        {/* Step 2: Delivery */}
        <div className="cart-step-node">
          <div className="cart-step-circle inactive">2</div>
          <span className="cart-step-label">Delivery</span>
        </div>

        <div className="cart-step-line" />

        {/* Step 3: Payment */}
        <div className="cart-step-node">
          <div className="cart-step-circle inactive">3</div>
          <span className="cart-step-label">Payment</span>
        </div>
      </div>`;

const newCartProgress = `{/* 3. Continuous Checkout Progress Bar */}
      <div className="cart-progress-wrap">
        {/* Step 1: Cart */}
        <div className="cart-step-node" style={{ cursor: 'default' }}>
          <div className="cart-step-circle active">1</div>
          <span className="cart-step-label active">Cart</span>
        </div>

        <div className="cart-step-line" />

        {/* Step 2: Delivery */}
        <div
          className="cart-step-node"
          onClick={() => {
            if (items.length > 0) navigate('/checkout');
          }}
          style={{ cursor: items.length > 0 ? 'pointer' : 'not-allowed' }}
          title={items.length > 0 ? 'Proceed to Delivery Address' : 'Cart is empty'}
        >
          <div className="cart-step-circle inactive">2</div>
          <span className="cart-step-label">Delivery</span>
        </div>

        <div className="cart-step-line" />

        {/* Step 3: Payment */}
        <div
          className="cart-step-node"
          onClick={() => {
            if (items.length > 0) navigate('/checkout');
          }}
          style={{ cursor: items.length > 0 ? 'pointer' : 'not-allowed' }}
          title={items.length > 0 ? 'Proceed to Payment Option' : 'Cart is empty'}
        >
          <div className="cart-step-circle inactive">3</div>
          <span className="cart-step-label">Payment</span>
        </div>
      </div>`;

if (cartContent.includes(oldCartProgress)) {
  cartContent = cartContent.replace(oldCartProgress, newCartProgress);
  fs.writeFileSync(cartPageFile, cartContent, 'utf8');
  console.log('✅ Updated CartPage.tsx continuous progress bar links');
} else {
  console.log('⚠️ Could not match oldCartProgress in CartPage.tsx');
}

// 2. Update CheckoutPage.tsx
const checkoutPageFile = path.join(frontendSrc, 'pages/CheckoutPage.tsx');
let checkoutContent = fs.readFileSync(checkoutPageFile, 'utf8');

// Ensure Check is imported in CheckoutPage.tsx
if (!checkoutContent.includes('Check,')) {
  checkoutContent = checkoutContent.replace(
    '  CheckCircle2,\n',
    '  CheckCircle2,\n  Check,\n'
  );
}

const oldCheckoutProgress = `{/* 2. Step Progress Bar */}
      <div className="cart-progress-wrap">
        <div className="cart-step-node" onClick={() => setStep(1)} style={{ cursor: 'pointer' }}>
          <div className={\`cart-step-circle \${step >= 1 ? 'active' : 'inactive'}\`}>1</div>
          <span className={\`cart-step-label \${step >= 1 ? 'active' : ''}\`}>Delivery Address</span>
        </div>

        <div className="cart-step-line" style={{ backgroundColor: step >= 2 ? '#15803D' : '#E2E8F0' }} />

        <div className="cart-step-node">
          <div className={\`cart-step-circle \${step >= 2 ? 'active' : 'inactive'}\`}>2</div>
          <span className={\`cart-step-label \${step >= 2 ? 'active' : ''}\`}>Razorpay Payment</span>
        </div>
      </div>`;

const newCheckoutProgress = `{/* 2. Continuous 3-Step Progress Bar matching Cart -> Delivery -> Payment */}
      <div className="cart-progress-wrap" style={{ margin: '0 auto 1.5rem', width: '100%', maxWidth: '540px' }}>
        {/* Step 1: Cart */}
        <div
          className="cart-step-node"
          onClick={() => navigate('/cart')}
          style={{ cursor: 'pointer' }}
          title="Back to Shopping Cart"
        >
          <div className="cart-step-circle active" style={{ backgroundColor: '#165B2E', color: '#ffffff' }}>
            <Check size={18} strokeWidth={3} />
          </div>
          <span className="cart-step-label active">Cart</span>
        </div>

        <div
          className="cart-step-line"
          style={{ backgroundColor: '#165B2E', transition: 'all 0.3s ease' }}
        />

        {/* Step 2: Delivery */}
        <div
          className="cart-step-node"
          onClick={() => setStep(1)}
          style={{ cursor: 'pointer' }}
          title="Delivery Address"
        >
          <div
            className={\`cart-step-circle \${step >= 1 ? 'active' : 'inactive'}\`}
            style={{ backgroundColor: step >= 1 ? '#165B2E' : undefined, color: step >= 1 ? '#ffffff' : undefined }}
          >
            {step === 2 ? <Check size={18} strokeWidth={3} /> : '2'}
          </div>
          <span className={\`cart-step-label \${step >= 1 ? 'active' : ''}\`}>Delivery</span>
        </div>

        <div
          className="cart-step-line"
          style={{ backgroundColor: step === 2 ? '#165B2E' : '#E5E7EB', transition: 'all 0.3s ease' }}
        />

        {/* Step 3: Payment */}
        <div
          className="cart-step-node"
          onClick={() => {
            if (step === 1 && fullName.trim() && phone.trim() && addressLine1.trim() && city.trim() && pincode.trim()) {
              setStep(2);
            }
          }}
          style={{ cursor: step === 2 ? 'default' : 'pointer' }}
          title="Payment Option (Razorpay)"
        >
          <div
            className={\`cart-step-circle \${step === 2 ? 'active' : 'inactive'}\`}
            style={{ backgroundColor: step === 2 ? '#165B2E' : undefined, color: step === 2 ? '#ffffff' : undefined }}
          >
            3
          </div>
          <span className={\`cart-step-label \${step === 2 ? 'active' : ''}\`}>Payment</span>
        </div>
      </div>`;

if (checkoutContent.includes(oldCheckoutProgress)) {
  checkoutContent = checkoutContent.replace(oldCheckoutProgress, newCheckoutProgress);
  fs.writeFileSync(checkoutPageFile, checkoutContent, 'utf8');
  console.log('✅ Updated CheckoutPage.tsx continuous 3-step progress bar');
} else {
  console.log('⚠️ Could not match oldCheckoutProgress in CheckoutPage.tsx');
}
