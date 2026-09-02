const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../farmer_frontend/src/pages/CartPage.tsx');

const content = `import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2,
  Minus,
  Plus,
  Heart,
  ChevronLeft,
  ChevronRight,
  Truck,
  Check,
  MapPin,
  Headphones,
  ShieldCheck,
  Star,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Package,
  X,
} from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { useProducts } from '../hooks/useProducts';
import { useWishlistStore } from '../store/wishlistStore';
import { useUIStore } from '../store/uiStore';
import { Product } from '@formerbench/shared';
import './CartPage.css';

interface SavedItemData {
  id: string;
  productId: string;
  title: string;
  price: number;
  image: string;
}

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const { items, subtotal, totalItems, updateQuantity, removeItem, clearCart, addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlistStore();

  // Clear Cart Modal State
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  // Fetch real products from Product Catalog API
  const { data: productsData } = useProducts({ limit: 12 });

  // Saved for Later items
  const [savedItems, setSavedItems] = useState<SavedItemData[]>([]);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Delivery checker state
  const [pincode, setPincode] = useState('');
  const [deliveryChecked, setDeliveryChecked] = useState(false);

  // Filter real catalog products for "You May Also Like" (excluding products currently in cart)
  const cartProductIds = new Set(items.map((i) => i.productId));
  const catalogProducts: Product[] = productsData?.data || [];
  const recommendedProducts = catalogProducts.filter((p) => !cartProductIds.has(p.id));

  const [recStartIndex, setRecStartIndex] = useState(0);

  const handleToggleWishlistProduct = (prod: Product) => {
    const added = toggleWishlist(prod);
    if (added) {
      addToast({ type: 'success', message: \`\${prod.title} added to wishlist\` });
    } else {
      addToast({ type: 'info', message: \`\${prod.title} removed from wishlist\` });
    }
  };

  const handleAddRecommendedToCart = (prod: Product) => {
    addToCart(prod, 1);
    addToast({ type: 'success', message: \`\${prod.title} added to cart!\` });
  };

  const handleNextRec = () => {
    if (recommendedProducts.length <= 3) return;
    setRecStartIndex((prev) => (prev + 1) % Math.max(1, recommendedProducts.length - 2));
  };

  const handlePrevRec = () => {
    if (recommendedProducts.length <= 3) return;
    setRecStartIndex((prev) => (prev - 1 + Math.max(1, recommendedProducts.length - 2)) % Math.max(1, recommendedProducts.length - 2));
  };

  // Calculations
  const freeDeliveryThreshold = 999;
  const isFreeDelivery = subtotal >= freeDeliveryThreshold;
  const deliveryFee = isFreeDelivery || items.length === 0 ? 0 : 80;
  const effectiveDiscount = subtotal > 0 && appliedCoupon ? Math.min(discountAmount, subtotal) : 0;
  const grandTotal = Math.max(0, subtotal - effectiveDiscount + deliveryFee);
  const freeDeliveryProgress = Math.min(100, Math.round((subtotal / freeDeliveryThreshold) * 100));

  const handleSaveForLater = (productId: string, title: string, price: number, image: string) => {
    removeItem(productId, productId);
    setSavedItems((prev) => [
      ...prev.filter((i) => i.productId !== productId),
      {
        id: \`saved-\${Date.now()}\`,
        productId,
        title,
        price,
        image,
      },
    ]);
    addToast({ type: 'info', message: \`\${title} moved to Saved for Later\` });
  };

  const handleMoveToCart = (item: SavedItemData) => {
    addToCart({
      id: item.productId,
      title: item.title,
      slug: item.productId,
      description: item.title,
      price: item.price,
      stock: 50,
      rating: 4.8,
      numReviews: 20,
      featured: false,
      images: [item.image],
      categoryId: 'saved',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any, 1);
    setSavedItems((prev) => prev.filter((i) => i.id !== item.id));
    addToast({ type: 'success', message: \`\${item.title} moved back to cart\` });
  };

  const handleConfirmClearCart = () => {
    clearCart();
    setIsClearModalOpen(false);
    addToast({ type: 'info', message: 'Cart has been cleared' });
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (code === 'FARMERBENCH120' || code === 'FARMER120' || code === 'AGRI120') {
      setAppliedCoupon(code);
      setDiscountAmount(120);
      addToast({ type: 'success', message: \`Coupon \${code} applied! You saved ₹120.00\` });
    } else if (code === 'FARMERBENCH20') {
      const discount = Math.round(subtotal * 0.2);
      setAppliedCoupon(code);
      setDiscountAmount(discount);
      addToast({ type: 'success', message: \`Coupon \${code} applied! 20% discount (₹\${discount})\` });
    } else {
      addToast({ type: 'error', message: 'Invalid coupon code. Try FARMERBENCH120' });
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    addToast({ type: 'info', message: 'Coupon removed' });
  };

  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (pincode.trim().length >= 6) {
      setDeliveryChecked(true);
      addToast({ type: 'success', message: \`Delivery available for pincode \${pincode}\` });
    } else {
      addToast({ type: 'error', message: 'Please enter a valid 6-digit pincode' });
    }
  };

  return (
    <div className="cart-page-layout">
      {/* 1. Breadcrumb */}
      <nav className="cart-breadcrumb" aria-label="Breadcrumb">
        <Link to="/" className="cart-breadcrumb-link">
          Home
        </Link>
        <span className="cart-breadcrumb-separator">/</span>
        <Link to="/products" className="cart-breadcrumb-link">
          Products
        </Link>
        <span className="cart-breadcrumb-separator">/</span>
        <span className="cart-breadcrumb-current">Shopping Cart</span>
      </nav>

      {/* 2. Top Header & Action */}
      <div className="cart-header-row">
        <div>
          <h1 className="cart-title">Your Shopping Cart</h1>
          <p className="cart-subtitle">
            {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        <Link to="/products" className="cart-top-continue-btn">
          <ChevronLeft size={16} strokeWidth={2.4} />
          <span>Continue Shopping</span>
        </Link>
      </div>

      {/* 3. Continuous Checkout Progress Bar */}
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
      </div>

      {/* 4. Main Grid: Left Cart Items Table & Right Sticky Summary */}
      <div className="cart-main-grid">
        {/* Left Column */}
        <div className="cart-left-col">
          {/* Cart Table Card */}
          <div className="cart-table-card">
            {/* Table Headings */}
            <div className="cart-table-head">
              <span>Product</span>
              <span style={{ textAlign: 'center' }}>Pack Size</span>
              <span style={{ textAlign: 'center' }}>Quantity</span>
              <span style={{ textAlign: 'right' }}>Price</span>
              <span style={{ textAlign: 'right' }}>Total</span>
            </div>

            {/* Cart Item Rows */}
            {items.length === 0 ? (
              <div style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
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
                    margin: '0 auto 1.25rem',
                  }}
                >
                  <ShoppingBag size={32} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F4726', marginBottom: '0.5rem' }}>
                  Your Shopping Cart is Empty
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#64748B', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
                  Looks like you haven't added any agricultural products to your cart yet. Explore our farm inputs, seeds, and bio-nutrients!
                </p>
                <Link to="/products" className="cart-footer-continue-btn">
                  Browse Agricultural Products
                </Link>
              </div>
            ) : (
              items.map((item) => {
                const prod = item.product || {};
                const price = prod.discountPrice ?? prod.price ?? 0;
                const originalPrice = prod.price ?? price;
                const title = prod.title || 'Agricultural Product';
                const category = (prod.category as any)?.name || 'Bio-Inputs & Farming';
                const image = prod.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600';
                const packSize = item.selectedAttributes?.packSize || '500 g';
                const rating = prod.rating || 4.6;
                const reviewsCount = prod.numReviews || 14;
                const isLowStock = (prod.stock || 99) <= 5;
                const stockLabel = isLowStock ? \`Only \${prod.stock} left\` : 'In Stock';
                const stockStatus = isLowStock ? 'low-stock' : 'in-stock';
                const itemTotal = price * item.quantity;

                return (
                  <div key={item.id || item.productId} className="cart-table-row">
                    {/* Product Details Cell */}
                    <div className="cart-product-cell">
                      <img src={image} alt={title} className="cart-product-img" />
                      <div className="cart-product-details">
                        <Link to={\`/product/\${prod.slug || item.productId}\`} className="cart-product-title">
                          {title}
                        </Link>
                        <span className="cart-product-category">{category}</span>

                        {/* Star Rating */}
                        <div className="cart-product-rating">
                          <div className="cart-stars-wrap">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={13}
                                fill={i < Math.floor(rating) ? '#F59E0B' : 'none'}
                                stroke="#F59E0B"
                              />
                            ))}
                          </div>
                          <span>{Number(rating).toFixed(1)}</span>
                          <span className="cart-rating-count">({reviewsCount})</span>
                        </div>

                        {/* Stock Status */}
                        <div className={\`cart-stock-badge \${stockStatus}\`}>
                          <span className={\`cart-stock-dot \${stockStatus}\`} />
                          <span>{stockLabel}</span>
                        </div>

                        {/* Actions: Save for later & Remove */}
                        <div className="cart-item-actions">
                          <button
                            onClick={() => handleSaveForLater(item.productId, title, price, image)}
                            className="cart-action-btn save"
                          >
                            <Heart size={14} />
                            <span>Save for Later</span>
                          </button>
                          <button
                            onClick={() => removeItem(item.id, item.productId)}
                            className="cart-action-btn remove"
                          >
                            <Trash2 size={14} />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Pack Size Cell */}
                    <div className="cart-pack-cell">
                      <span className="cart-pack-badge">{packSize}</span>
                    </div>

                    {/* Quantity Cell */}
                    <div className="cart-qty-cell">
                      <div className="cart-qty-control">
                        <button
                          onClick={() => updateQuantity(item.id, item.productId, Math.max(1, item.quantity - 1))}
                          disabled={item.quantity <= 1}
                          className="cart-qty-btn"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="cart-qty-val">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.productId, item.quantity + 1)}
                          className="cart-qty-btn"
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Price Cell */}
                    <div className="cart-price-cell">
                      <span className="cart-current-price">₹{Number(price).toFixed(2)}</span>
                      {prod.discountPrice && (
                        <span className="cart-original-price">₹{Number(originalPrice).toFixed(2)}</span>
                      )}
                    </div>

                    {/* Total Cell */}
                    <div className="cart-total-cell">
                      <span className="cart-row-total">₹{Number(itemTotal).toFixed(2)}</span>
                    </div>
                  </div>
                );
              })
            )}

            {/* Cart Table Footer */}
            {items.length > 0 && (
              <div className="cart-table-footer">
                <Link to="/products" className="cart-footer-continue-btn">
                  <ChevronLeft size={16} />
                  <span>Continue Shopping</span>
                </Link>

                <button onClick={() => setIsClearModalOpen(true)} className="cart-footer-clear-btn">
                  <Trash2 size={15} />
                  <span>Clear Shopping Cart</span>
                </button>
              </div>
            )}
          </div>

          {/* Free Shipping Progress Indicator */}
          {items.length > 0 && (
            <div className="cart-shipping-card">
              <div className="cart-shipping-head">
                <div className="cart-shipping-icon-wrap">
                  <Truck size={18} />
                </div>
                <div className="cart-shipping-text">
                  {isFreeDelivery ? (
                    <p className="cart-shipping-msg unlocked">
                      🌾 <strong>Congratulations!</strong> You have unlocked <strong>FREE Express Delivery</strong>.
                    </p>
                  ) : (
                    <p className="cart-shipping-msg">
                      Add <strong>₹{(freeDeliveryThreshold - subtotal).toFixed(2)}</strong> more of farm inputs for <strong>FREE Delivery</strong>!
                    </p>
                  )}
                </div>
              </div>
              <div className="cart-progress-bar-bg">
                <div
                  className={\`cart-progress-bar-fill \${isFreeDelivery ? 'complete' : ''}\`}
                  style={{ width: \`\${freeDeliveryProgress}%\` }}
                />
              </div>
            </div>
          )}

          {/* Saved for Later Section */}
          {savedItems.length > 0 && (
            <div className="cart-saved-section">
              <h3 className="cart-section-title">Saved for Later ({savedItems.length})</h3>
              <div className="cart-saved-grid">
                {savedItems.map((sItem) => (
                  <div key={sItem.id} className="cart-saved-card">
                    <img src={sItem.image} alt={sItem.title} className="cart-saved-img" />
                    <div className="cart-saved-info">
                      <h4 className="cart-saved-title">{sItem.title}</h4>
                      <span className="cart-saved-price">₹{Number(sItem.price).toFixed(2)}</span>
                      <button
                        onClick={() => handleMoveToCart(sItem)}
                        className="cart-move-to-cart-btn"
                      >
                        <ShoppingBag size={14} />
                        <span>Move to Cart</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cross-Sell Recommendations: You May Also Like */}
          {recommendedProducts.length > 0 && (
            <div className="cart-rec-section">
              <div className="cart-rec-header">
                <div>
                  <h3 className="cart-section-title">You May Also Like</h3>
                  <p className="cart-section-sub">Top-rated bio-inputs recommended for your crops</p>
                </div>
                {recommendedProducts.length > 3 && (
                  <div className="cart-rec-nav">
                    <button onClick={handlePrevRec} className="cart-rec-nav-btn" aria-label="Previous recommendations">
                      <ChevronLeft size={16} />
                    </button>
                    <button onClick={handleNextRec} className="cart-rec-nav-btn" aria-label="Next recommendations">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="cart-rec-grid">
                {recommendedProducts.slice(recStartIndex, recStartIndex + 3).map((prod) => {
                  const isWishlisted = isInWishlist(prod.id);
                  const price = prod.discountPrice ?? prod.price ?? 0;
                  const prodImage = prod.images?.[0];
                  const categoryName = (prod.category as any)?.name || 'Agri Inputs';
                  const rating = prod.rating || 4.8;
                  const reviewsCount = prod.numReviews || 0;

                  return (
                    <div key={prod.id} className="cart-rec-card">
                      <div className="cart-rec-img-wrap">
                        {prodImage ? (
                          <img src={prodImage} alt={prod.title} className="cart-rec-img" />
                        ) : (
                          <div
                            className="cart-rec-img"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}
                          >
                            <Package size={28} color="#94A3B8" />
                          </div>
                        )}
                        <button
                          onClick={() => handleToggleWishlistProduct(prod)}
                          className={\`cart-rec-wish-btn \${isWishlisted ? 'active' : ''}\`}
                          aria-label="Add to wishlist"
                        >
                          <Heart size={16} fill={isWishlisted ? '#DC2626' : 'none'} stroke={isWishlisted ? '#DC2626' : '#475569'} />
                        </button>
                      </div>

                      <div className="cart-rec-body">
                        <span className="cart-rec-category">{categoryName}</span>
                        <h4
                          className="cart-rec-name"
                          onClick={() => navigate(\`/product/\${prod.slug || prod.id}\`)}
                          style={{ cursor: 'pointer' }}
                          title={prod.title}
                        >
                          {prod.title}
                        </h4>

                        <div className="cart-rec-rating">
                          <div className="cart-stars-wrap">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={12}
                                fill={i < Math.floor(rating) ? '#F59E0B' : 'none'}
                                stroke="#F59E0B"
                              />
                            ))}
                          </div>
                          <span>{Number(rating).toFixed(1)}</span>
                          {reviewsCount > 0 && (
                            <span style={{ color: '#94A3B8' }}>({reviewsCount})</span>
                          )}
                        </div>

                        <div className="cart-rec-footer">
                          <div>
                            <span className="cart-rec-price">₹{Number(price).toFixed(2)}</span>
                          </div>

                          <button
                            onClick={() => handleAddRecommendedToCart(prod)}
                            className="cart-rec-add-btn"
                            aria-label="Add to Cart"
                          >
                            <ShoppingBag size={15} />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Sticky Column: Order Summary & Checkout */}
        <div className="cart-right-col">
          <div className="cart-summary-card">
            <h2 className="cart-summary-title">Order Summary</h2>

            {/* Delivery Pincode Checker */}
            <div className="cart-pincode-box">
              <span className="cart-pincode-label">
                <MapPin size={14} />
                <span>Estimate Delivery to Pincode</span>
              </span>
              <form onSubmit={handleCheckPincode} className="cart-pincode-form">
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Enter Pincode"
                  className="cart-pincode-input"
                />
                <button type="submit" className="cart-pincode-btn">
                  Check
                </button>
              </form>
              {deliveryChecked && (
                <div className="cart-pincode-result">
                  <Check size={14} />
                  <span>Delivery in 24-48 Hours to {pincode}</span>
                </div>
              )}
            </div>

            {/* Price Line Items */}
            <div className="cart-summary-lines">
              <div className="cart-summary-row">
                <span className="cart-summary-label">Subtotal ({totalItems} items)</span>
                <span className="cart-summary-val">₹{subtotal.toFixed(2)}</span>
              </div>

              <div className="cart-summary-row">
                <span className="cart-summary-label">Estimated Delivery</span>
                <span className="cart-summary-val" style={{ color: isFreeDelivery ? '#15803D' : undefined }}>
                  {isFreeDelivery ? 'FREE' : items.length === 0 ? '₹0.00' : \`₹\${deliveryFee.toFixed(2)}\`}
                </span>
              </div>

              {appliedCoupon && effectiveDiscount > 0 && (
                <div className="cart-summary-row discount">
                  <span className="cart-summary-label">
                    Coupon ({appliedCoupon})
                    <button onClick={handleRemoveCoupon} className="cart-remove-coupon-btn">
                      ✕
                    </button>
                  </span>
                  <span className="cart-summary-val discount">- ₹{effectiveDiscount.toFixed(2)}</span>
                </div>
              )}

              <div className="cart-summary-row total">
                <span className="cart-summary-total-label">Grand Total</span>
                <span className="cart-summary-total-val">₹{grandTotal.toFixed(2)}</span>
              </div>
              <span className="cart-tax-notice">Includes all applicable GST & farm taxes</span>
            </div>

            {/* Promo Code Input */}
            <div className="cart-coupon-box">
              <form onSubmit={handleApplyCoupon} className="cart-coupon-form">
                <input
                  type="text"
                  placeholder="Promo code (e.g. FARMERBENCH120)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="cart-coupon-input"
                />
                <button type="submit" className="cart-coupon-btn">
                  Apply
                </button>
              </form>
              <p className="cart-coupon-hint">
                <Sparkles size={13} />
                <span>Tip: Use code <strong>FARMERBENCH120</strong> for ₹120 off orders</span>
              </p>
            </div>

            {/* Primary Checkout Button */}
            <button
              onClick={() => navigate('/checkout')}
              disabled={items.length === 0}
              className="cart-checkout-btn"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={18} strokeWidth={2.4} />
            </button>

            {/* Safe & Secure Guarantee Badges */}
            <div className="cart-trust-badges">
              <div className="cart-trust-item">
                <ShieldCheck size={16} className="cart-trust-icon" />
                <span>100% Certified Genuine Agri-Inputs</span>
              </div>
              <div className="cart-trust-item">
                <Truck size={16} className="cart-trust-icon" />
                <span>Direct Farm Gate Dispatch in 24-48 Hours</span>
              </div>
              <div className="cart-trust-item">
                <Headphones size={16} className="cart-trust-icon" />
                <span>Free Agronomist Advisory: 1800-AGRI-FLOW</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= CUSTOM CONFIRMATION MODAL FOR CLEAR CART ================= */}
      {isClearModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
          onClick={() => setIsClearModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              maxWidth: '440px',
              width: '100%',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '1rem',
              position: 'relative',
              animation: 'modalSlideUp 0.2s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button Top Right */}
            <button
              type="button"
              onClick={() => setIsClearModalOpen(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            {/* Trash / Warning Icon Circle */}
            <div
              style={{
                width: '58px',
                height: '58px',
                borderRadius: '50%',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.25rem',
              }}
            >
              <Trash2 size={28} />
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>
              Clear Shopping Cart?
            </h3>

            <p style={{ fontSize: '0.925rem', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
              Are you sure you want to remove all <strong>{totalItems} item{totalItems > 1 ? 's' : ''}</strong> from your shopping cart? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '0.85rem', width: '100%', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                style={{
                  flex: 1,
                  padding: '0.85rem 1.25rem',
                  borderRadius: '12px',
                  border: '1.5px solid #CBD5E1',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmClearCart}
                style={{
                  flex: 1,
                  padding: '0.85rem 1.25rem',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#DC2626',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
                  transition: 'all 0.2s',
                }}
              >
                Yes, Clear Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
`;

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Successfully updated CartPage.tsx with correct types and custom modal.');
