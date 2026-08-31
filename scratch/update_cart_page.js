const fs = require('fs');
const path = require('path');

const cartPagePath = path.resolve(__dirname, '../../farmer_frontend/src/pages/CartPage.tsx');

const cartPageContent = `import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2,
  Heart,
  ChevronLeft,
  ChevronRight,
  Truck,
  Check,
  MapPin,
  Headphones,
  MessageSquare,
  ShieldCheck,
  Star,
  ArrowRight,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { useUIStore } from '../store/uiStore';
import './CartPage.css';

// Product fallback images for recommendations
import growthBoosterImg from '../assets/growth-booster.jpg';
import neemOilImg from '../assets/neem-oil-bottle.jpg';
import humicPowerImg from '../assets/humic-power.jpg';
import bioPowerImg from '../assets/bio-power-promoter.jpg';
import seaweedExtractImg from '../assets/seaweed-extract.jpg';
import trichodermaImg from '../assets/trichoderma-fungicide.jpg';

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

  // Saved for Later items
  const [savedItems, setSavedItems] = useState<SavedItemData[]>([
    {
      id: 'saved-item-1',
      productId: 'bio-power',
      title: 'Bio Power Organic Growth Promoter',
      price: 450,
      image: bioPowerImg,
    },
    {
      id: 'saved-item-2',
      productId: 'seaweed-extract',
      title: 'Seaweed Extract Plant Enhancer',
      price: 550,
      image: seaweedExtractImg,
    },
  ]);

  // Coupon state
  const [couponCode, setCouponCode] = useState('FARMERBENCH120');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(subtotal >= 500 ? 'FARMERBENCH120' : null);
  const [discountAmount, setDiscountAmount] = useState(subtotal >= 500 ? 120 : 0);

  // Delivery checker state
  const [pincode, setPincode] = useState('641001');
  const [deliveryChecked, setDeliveryChecked] = useState(true);

  // Recommended Products ("You May Also Like")
  const recommendedProducts = [
    {
      id: 'rec-1',
      productId: 'trichoderma-fungicide',
      title: 'Trichoderma Bio Fungicide',
      category: 'Bio Fungicides',
      rating: 4.8,
      reviewsCount: 88,
      price: 480,
      image: trichodermaImg,
      packSize: '1 L',
      availableSizes: ['500 ml', '1 L', '5 L'],
    },
    {
      id: 'rec-2',
      productId: 'flowering-booster',
      title: 'Flowering Booster',
      category: 'Crop Nutrition',
      rating: 4.7,
      reviewsCount: 53,
      price: 540,
      image: growthBoosterImg,
      packSize: '500 ml',
      availableSizes: ['250 ml', '500 ml', '1 L'],
    },
    {
      id: 'rec-3',
      productId: 'organic-root-developer',
      title: 'Organic Root Developer',
      category: 'Bio Stimulants',
      rating: 4.6,
      reviewsCount: 66,
      price: 480,
      image: humicPowerImg,
      packSize: '1 kg',
      availableSizes: ['500 g', '1 kg', '5 kg'],
    },
    {
      id: 'rec-4',
      productId: 'plant-shield-pesticide',
      title: 'Plant Shield Bio Pesticide',
      category: 'Bio Pesticides',
      rating: 4.5,
      reviewsCount: 64,
      price: 460,
      image: bioPowerImg,
      packSize: '1 L',
      availableSizes: ['500 ml', '1 L', '5 L'],
    },
    {
      id: 'rec-5',
      productId: 'seaweed-extract-enhancer',
      title: 'Seaweed Extract Plant Enhancer',
      category: 'Plant Growth Promoter',
      rating: 4.9,
      reviewsCount: 142,
      price: 550,
      image: seaweedExtractImg,
      packSize: '1 L',
      availableSizes: ['500 ml', '1 L', '5 L'],
    },
    {
      id: 'rec-6',
      productId: 'cold-pressed-neem-oil',
      title: 'Neem Oil 100% Cold Pressed',
      category: 'Plant Protection',
      rating: 4.7,
      reviewsCount: 112,
      price: 320,
      image: neemOilImg,
      packSize: '500 ml',
      availableSizes: ['250 ml', '500 ml', '1 L'],
    },
  ];

  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [recStartIndex, setRecStartIndex] = useState(0);

  const handleToggleWishlist = (id: string, title: string) => {
    setWishlistIds((prev) => {
      const isSaved = prev.includes(id);
      if (isSaved) {
        addToast({ type: 'info', message: \`\${title} removed from wishlist\` });
        return prev.filter((item) => item !== id);
      } else {
        addToast({ type: 'success', message: \`\${title} added to wishlist\` });
        return [...prev, id];
      }
    });
  };

  const handleAddRecommendedToCart = (prod: typeof recommendedProducts[0]) => {
    addToCart({
      id: prod.productId,
      title: prod.title,
      slug: prod.productId,
      description: prod.title,
      price: prod.price,
      stock: 50,
      rating: prod.rating,
      numReviews: prod.reviewsCount,
      featured: false,
      images: [prod.image],
      categoryId: 'recommended',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any, 1);
    addToast({ type: 'success', message: \`\${prod.title} added to cart!\` });
  };

  const handleNextRec = () => {
    setRecStartIndex((prev) => (prev + 1) % (recommendedProducts.length - 3));
  };

  const handlePrevRec = () => {
    setRecStartIndex((prev) => (prev - 1 + (recommendedProducts.length - 3)) % (recommendedProducts.length - 3));
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

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear all items in your cart?')) {
      clearCart();
      addToast({ type: 'info', message: 'Cart has been cleared' });
    }
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

      {/* 3. Step Checkout Progress Bar */}
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
                const category = prod.category?.name || 'Bio-Inputs & Farming';
                const image = prod.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600';
                const packSize = item.selectedAttributes?.packSize || 'Standard Pack';
                const rating = prod.rating || 4.8;
                const reviewsCount = prod.numReviews || 45;
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
                          <span>{rating}</span>
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

                    {/* Pack Size Selector */}
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <span className="cart-pack-select" style={{ display: 'inline-block', lineHeight: '28px' }}>
                        {packSize}
                      </span>
                    </div>

                    {/* Quantity Selector */}
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <div className="cart-qty-control">
                        <button
                          onClick={() => updateQuantity(item.id, item.productId, item.quantity - 1)}
                          className="cart-qty-btn"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="cart-qty-val">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.productId, item.quantity + 1)}
                          className="cart-qty-btn"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Price Cell */}
                    <div className="cart-price-cell">
                      <span className="cart-price-main">₹{price.toFixed(2)}</span>
                      {prod.discountPrice && prod.discountPrice < originalPrice && (
                        <span className="cart-price-orig">₹{originalPrice.toFixed(2)}</span>
                      )}
                    </div>

                    {/* Total Cell */}
                    <div className="cart-total-cell">
                      <span className="cart-total-val">₹{itemTotal.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })
            )}

            {/* Bottom Actions Bar inside Card */}
            {items.length > 0 && (
              <div className="cart-table-footer">
                <Link to="/products" className="cart-footer-continue-btn">
                  <ChevronLeft size={16} strokeWidth={2.4} />
                  <span>Continue Shopping</span>
                </Link>

                <button onClick={handleClearCart} className="cart-footer-clear-btn">
                  <Trash2 size={15} />
                  <span>Clear Shopping Cart</span>
                </button>
              </div>
            )}
          </div>

          {/* 5. Free Delivery Progress Box */}
          <div className="cart-free-delivery-card">
            <div className="cart-delivery-header">
              <div className="cart-delivery-icon-box">
                <Truck size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <p className="cart-delivery-title">
                  {isFreeDelivery ? (
                    <span style={{ color: '#15803D', fontWeight: 800 }}>
                      🎉 Congratulations! You have unlocked FREE Express Delivery.
                    </span>
                  ) : (
                    <>
                      Add <strong style={{ color: '#0F4726' }}>₹{(freeDeliveryThreshold - subtotal).toFixed(2)}</strong>{' '}
                      more of farm inputs to get <strong>FREE Delivery</strong>!
                    </>
                  )}
                </p>
                <div className="cart-progress-bar-bg">
                  <div
                    className="cart-progress-bar-fill"
                    style={{ width: \`\${freeDeliveryProgress}%\` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 6. Saved for Later Section */}
          {savedItems.length > 0 && (
            <div className="cart-saved-section">
              <div className="cart-saved-header">
                <h2 className="cart-saved-title">Saved for Later ({savedItems.length})</h2>
                <span style={{ fontSize: '0.82rem', color: '#64748B' }}>Items saved from previous visits</span>
              </div>

              <div className="cart-saved-grid">
                {savedItems.map((item) => (
                  <div key={item.id} className="cart-saved-card">
                    <img src={item.image} alt={item.title} className="cart-saved-img" />
                    <div className="cart-saved-info">
                      <h4 className="cart-saved-name">{item.title}</h4>
                      <p className="cart-saved-price">₹{item.price.toFixed(2)}</p>
                      <button
                        onClick={() => handleMoveToCart(item)}
                        className="cart-move-btn"
                      >
                        Move to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. Recommended Products Carousel ("You May Also Like") */}
          <div className="cart-recommended-section">
            <div className="cart-rec-header">
              <div>
                <h2 className="cart-rec-title">You May Also Like</h2>
                <p className="cart-rec-subtitle">Top-rated bio-inputs recommended for your crops</p>
              </div>

              <div className="cart-rec-nav">
                <button
                  onClick={handlePrevRec}
                  className="cart-rec-nav-btn"
                  aria-label="Previous recommended products"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={handleNextRec}
                  className="cart-rec-nav-btn"
                  aria-label="Next recommended products"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div className="cart-rec-grid">
              {recommendedProducts.slice(recStartIndex, recStartIndex + 3).map((prod) => {
                const isWishlisted = wishlistIds.includes(prod.id);
                return (
                  <div key={prod.id} className="cart-rec-card">
                    <div className="cart-rec-img-wrap">
                      <img src={prod.image} alt={prod.title} className="cart-rec-img" />
                      <button
                        onClick={() => handleToggleWishlist(prod.id, prod.title)}
                        className={\`cart-rec-wish-btn \${isWishlisted ? 'active' : ''}\`}
                        aria-label="Add to wishlist"
                      >
                        <Heart size={16} fill={isWishlisted ? '#DC2626' : 'none'} stroke={isWishlisted ? '#DC2626' : '#475569'} />
                      </button>
                    </div>

                    <div className="cart-rec-body">
                      <span className="cart-rec-category">{prod.category}</span>
                      <h4 className="cart-rec-name">{prod.title}</h4>

                      <div className="cart-rec-rating">
                        <div className="cart-stars-wrap">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              fill={i < Math.floor(prod.rating) ? '#F59E0B' : 'none'}
                              stroke="#F59E0B"
                            />
                          ))}
                        </div>
                        <span>{prod.rating}</span>
                        <span style={{ color: '#94A3B8' }}>({prod.reviewsCount})</span>
                      </div>

                      <div className="cart-rec-footer">
                        <div>
                          <span className="cart-rec-price">₹{prod.price.toFixed(2)}</span>
                          <span className="cart-rec-size"> / {prod.packSize}</span>
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
    </div>
  );
};

export default CartPage;
`;

fs.writeFileSync(cartPagePath, cartPageContent, 'utf8');
console.log('✅ Updated CartPage.tsx with full live useCart() connection!');
