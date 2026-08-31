const fs = require('fs');
const path = require('path');

const cssPath = path.resolve(__dirname, '../../farmer_frontend/src/pages/CartPage.css');

const cssContent = `/* ==========================================================================
   CART PAGE STYLES — Pixel-Perfect Agricultural E-Commerce Design
   ========================================================================== */

.cart-page-layout {
  max-width: 1280px;
  width: 100%;
  margin: 0 auto;
  padding: 1.5rem 1.5rem 5rem;
  color: var(--text-primary, #111827);
  background-color: var(--bg-primary, #ffffff);
  box-sizing: border-box;
}

/* 1. Breadcrumb */
.cart-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.88rem;
  color: var(--text-muted, #6B7280);
  margin-bottom: 1.25rem;
}

.cart-breadcrumb-link {
  color: var(--text-muted, #6B7280);
  text-decoration: none;
  transition: color 0.2s;
}

.cart-breadcrumb-link:hover {
  color: #165B2E;
  text-decoration: underline;
}

.cart-breadcrumb-separator {
  color: #9CA3AF;
}

.cart-breadcrumb-current {
  color: var(--text-primary, #111827);
  font-weight: 600;
}

/* 2. Top Header */
.cart-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.cart-title {
  font-size: clamp(1.6rem, 2.5vw, 2.1rem);
  font-weight: 800;
  color: #0F4726;
  margin: 0 0 0.25rem 0;
  letter-spacing: -0.02em;
}

.cart-subtitle {
  font-size: 0.925rem;
  color: #64748B;
  margin: 0;
  font-weight: 500;
}

.cart-top-continue-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background-color: #ffffff;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  padding: 0.6rem 1.15rem;
  font-size: 0.9rem;
  font-weight: 700;
  color: #165B2E;
  text-decoration: none;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.cart-top-continue-btn:hover {
  background-color: #F0FDF4;
  border-color: #165B2E;
  transform: translateX(-2px);
}

/* 3. Step Checkout Progress Bar */
.cart-progress-wrap {
  display: flex;
  align-items: center;
  margin-bottom: 2.25rem;
  max-width: 540px;
}

.cart-step-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  user-select: none;
}

.cart-step-circle {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.92rem;
  transition: all 0.2s ease;
}

.cart-step-circle.active {
  background-color: #165B2E;
  color: #ffffff;
  box-shadow: 0 4px 10px rgba(22, 91, 46, 0.3);
}

.cart-step-circle.inactive {
  background-color: #ffffff;
  border: 1.5px solid #CBD5E1;
  color: #64748B;
}

.cart-step-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748B;
}

.cart-step-label.active {
  color: #165B2E;
  font-weight: 800;
}

.cart-step-line {
  flex: 1;
  height: 2px;
  background-color: #E2E8F0;
  margin: 0 1rem 1.4rem;
  min-width: 40px;
}

/* 4. Main 2-Column Grid Layout */
.cart-main-grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 2rem;
  align-items: flex-start;
}

/* Left Column Container */
.cart-left-col {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  min-width: 0;
}

/* Cart Items Table Card */
.cart-table-card {
  background-color: #ffffff;
  border: 1px solid #E2E8F0;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
}

.cart-table-head {
  display: grid;
  grid-template-columns: 3fr 1.1fr 1.3fr 1.1fr 1.1fr;
  padding: 1rem 1.5rem;
  background-color: #F8FAFC;
  border-bottom: 1px solid #E2E8F0;
  font-size: 0.85rem;
  font-weight: 700;
  color: #475569;
  letter-spacing: 0.02em;
}

.cart-table-row {
  display: grid;
  grid-template-columns: 3fr 1.1fr 1.3fr 1.1fr 1.1fr;
  padding: 1.5rem;
  border-bottom: 1px solid #F1F5F9;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;
}

.cart-table-row:last-child {
  border-bottom: none;
}

/* Product Info Cell */
.cart-product-cell {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  min-width: 0;
}

.cart-product-img {
  width: 76px;
  height: 76px;
  object-fit: cover;
  background-color: #FAFAFA;
  border-radius: 10px;
  border: 1px solid #E2E8F0;
  flex-shrink: 0;
  padding: 2px;
}

.cart-product-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.cart-product-title {
  font-size: 0.96rem;
  font-weight: 700;
  color: #1E293B;
  text-decoration: none;
  line-height: 1.35;
  transition: color 0.2s ease;
}

.cart-product-title:hover {
  color: #165B2E;
}

.cart-product-category {
  font-size: 0.78rem;
  color: #64748B;
  font-weight: 500;
}

.cart-product-rating {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #1E293B;
}

.cart-stars-wrap {
  display: flex;
  align-items: center;
  color: #F59E0B;
}

.cart-rating-count {
  color: #94A3B8;
  font-weight: 400;
  font-size: 0.75rem;
}

.cart-stock-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  font-weight: 600;
}

.cart-stock-badge.in-stock {
  color: #15803D;
}

.cart-stock-badge.low-stock {
  color: #D97706;
}

.cart-stock-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.cart-stock-dot.in-stock {
  background-color: #15803D;
}

.cart-stock-dot.low-stock {
  background-color: #D97706;
}

.cart-item-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.35rem;
}

.cart-action-btn {
  background: transparent;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s ease;
}

.cart-action-btn.save {
  color: #64748B;
}

.cart-action-btn.save:hover {
  color: #165B2E;
}

.cart-action-btn.remove {
  color: #DC2626;
}

.cart-action-btn.remove:hover {
  color: #991B1B;
  text-decoration: underline;
}

/* Pack Size Badge */
.cart-pack-select {
  padding: 0.4rem 0.75rem;
  border: 1px solid #CBD5E1;
  border-radius: 8px;
  background-color: #F8FAFC;
  color: #334155;
  font-size: 0.85rem;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
}

/* Quantity Control Box */
.cart-qty-control {
  display: inline-flex;
  align-items: center;
  border: 1.5px solid #CBD5E1;
  border-radius: 8px;
  background-color: #ffffff;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}

.cart-qty-btn {
  background: transparent;
  border: none;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1E293B;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 1.1rem;
  font-weight: 700;
}

.cart-qty-btn:hover {
  background-color: #F1F5F9;
  color: #165B2E;
}

.cart-qty-val {
  width: 34px;
  text-align: center;
  font-size: 0.92rem;
  font-weight: 700;
  color: #1E293B;
}

/* Price Cell & Total Cell */
.cart-price-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  text-align: right;
  gap: 0.2rem;
}

.cart-price-main {
  font-size: 0.98rem;
  font-weight: 700;
  color: #1E293B;
}

.cart-price-orig {
  font-size: 0.8rem;
  color: #94A3B8;
  text-decoration: line-through;
}

.cart-total-cell {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  text-align: right;
}

.cart-total-val {
  font-size: 1.05rem;
  font-weight: 800;
  color: #165B2E;
}

/* Bottom Action Row of Cart Table */
.cart-table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #E2E8F0;
  background-color: #F8FAFC;
  gap: 1rem;
  flex-wrap: wrap;
}

.cart-footer-continue-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background-color: #ffffff;
  border: 1.5px solid #165B2E;
  border-radius: 8px;
  padding: 0.55rem 1.15rem;
  font-size: 0.88rem;
  font-weight: 700;
  color: #165B2E;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cart-footer-continue-btn:hover {
  background-color: #165B2E;
  color: #ffffff;
}

.cart-footer-clear-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #ffffff;
  border: 1px solid #FCA5A5;
  color: #DC2626;
  padding: 0.55rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cart-footer-clear-btn:hover {
  background-color: #FEF2F2;
  border-color: #DC2626;
}

/* 5. Free Delivery Unlocked Card */
.cart-free-delivery-card {
  background-color: #F0FDF4;
  border: 1px solid #DCFCE7;
  border-radius: 14px;
  padding: 1.25rem 1.5rem;
}

.cart-delivery-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.cart-delivery-icon-box {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background-color: #DCFCE7;
  color: #15803D;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cart-delivery-title {
  font-size: 0.9rem;
  color: #334155;
  margin: 0 0 0.5rem 0;
}

.cart-progress-bar-bg {
  width: 100%;
  height: 8px;
  background-color: #E2E8F0;
  border-radius: 999px;
  overflow: hidden;
}

.cart-progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #165B2E 0%, #22C55E 100%);
  border-radius: 999px;
  transition: width 0.3s ease;
}

/* 6. Saved for Later Section */
.cart-saved-section {
  background-color: #ffffff;
  border: 1px solid #E2E8F0;
  border-radius: 16px;
  padding: 1.5rem;
}

.cart-saved-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.cart-saved-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0F4726;
  margin: 0;
}

.cart-saved-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.25rem;
}

.cart-saved-card {
  background-color: #ffffff;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.03);
}

.cart-saved-img {
  width: 100%;
  height: 110px;
  object-fit: cover;
  background-color: #FAFAFA;
  border-radius: 8px;
  border: 1px solid #F1F5F9;
}

.cart-saved-info {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
}

.cart-saved-name {
  font-size: 0.88rem;
  font-weight: 700;
  color: #1E293B;
  line-height: 1.3;
  margin: 0;
}

.cart-saved-price {
  font-size: 0.95rem;
  font-weight: 800;
  color: #165B2E;
  margin: 0;
}

.cart-move-btn {
  width: 100%;
  padding: 0.55rem;
  background-color: #ffffff;
  border: 1.5px solid #165B2E;
  color: #165B2E;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.825rem;
  cursor: pointer;
  margin-top: auto;
  transition: all 0.2s;
}

.cart-move-btn:hover {
  background-color: #165B2E;
  color: #ffffff;
}

/* 7. Recommended Products ("You May Also Like") */
.cart-recommended-section {
  background-color: #ffffff;
  border: 1px solid #E2E8F0;
  border-radius: 16px;
  padding: 1.5rem;
}

.cart-rec-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.cart-rec-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0F4726;
  margin: 0;
}

.cart-rec-subtitle {
  font-size: 0.825rem;
  color: #64748B;
  margin: 0.15rem 0 0 0;
}

.cart-rec-nav {
  display: flex;
  gap: 0.4rem;
}

.cart-rec-nav-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #CBD5E1;
  background-color: #ffffff;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.cart-rec-nav-btn:hover {
  background-color: #F8FAFC;
  border-color: #165B2E;
  color: #165B2E;
}

.cart-rec-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.cart-rec-card {
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 0.85rem;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  transition: transform 0.2s, box-shadow 0.2s;
}

.cart-rec-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.cart-rec-img-wrap {
  position: relative;
  width: 100%;
  height: 120px;
  background-color: #FAFAFA;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 0.65rem;
}

.cart-rec-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cart-rec-wish-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  background-color: #ffffff;
  border: 1px solid #E2E8F0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.cart-rec-body {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  flex: 1;
}

.cart-rec-category {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #15803D;
  letter-spacing: 0.03em;
}

.cart-rec-name {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1E293B;
  margin: 0;
  line-height: 1.3;
}

.cart-rec-rating {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.cart-rec-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 0.5rem;
  border-top: 1px solid #F1F5F9;
}

.cart-rec-price {
  font-size: 0.95rem;
  font-weight: 800;
  color: #0F4726;
}

.cart-rec-size {
  font-size: 0.72rem;
  color: #64748B;
}

.cart-rec-add-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.4rem 0.75rem;
  background-color: #F0FDF4;
  border: 1px solid #165B2E;
  color: #165B2E;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.cart-rec-add-btn:hover {
  background-color: #165B2E;
  color: #ffffff;
}

/* ==========================================================================
   RIGHT STICKY ORDER SUMMARY CARD
   ========================================================================== */

.cart-right-col {
  position: sticky;
  top: 100px;
}

.cart-summary-card {
  background-color: #ffffff;
  border: 1px solid #E2E8F0;
  border-radius: 16px;
  padding: 1.75rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.cart-summary-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0F4726;
  margin: 0;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #F1F5F9;
}

/* Delivery Pincode Checker */
.cart-pincode-box {
  background-color: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.cart-pincode-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.cart-pincode-form {
  display: flex;
  gap: 0.5rem;
}

.cart-pincode-input {
  flex: 1;
  padding: 0.6rem 0.85rem;
  border: 1px solid #CBD5E1;
  border-radius: 8px;
  font-size: 0.9rem;
  background-color: #ffffff;
  outline: none;
}

.cart-pincode-input:focus {
  border-color: #165B2E;
}

.cart-pincode-btn {
  padding: 0.6rem 1.15rem;
  background-color: #165B2E;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.cart-pincode-btn:hover {
  background-color: #0F4726;
}

.cart-pincode-result {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #15803D;
  font-size: 0.825rem;
  font-weight: 600;
}

/* Summary Lines */
.cart-summary-lines {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 0.75rem 0;
  border-top: 1px solid #F1F5F9;
  border-bottom: 1px solid #F1F5F9;
}

.cart-summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.95rem;
}

.cart-summary-label {
  color: #475569;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.cart-summary-val {
  font-weight: 700;
  color: #1E293B;
}

.cart-summary-row.discount .cart-summary-label {
  color: #15803D;
  font-weight: 600;
}

.cart-summary-row.discount .cart-summary-val {
  color: #15803D;
  font-weight: 800;
}

.cart-remove-coupon-btn {
  background: transparent;
  border: none;
  color: #DC2626;
  cursor: pointer;
  font-size: 0.75rem;
  margin-left: 0.3rem;
  font-weight: 800;
}

.cart-summary-row.total {
  margin-top: 0.4rem;
  padding-top: 0.75rem;
  border-top: 1.5px dashed #E2E8F0;
}

.cart-summary-total-label {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0F4726;
}

.cart-summary-total-val {
  font-size: 1.35rem;
  font-weight: 800;
  color: #165B2E;
}

.cart-tax-notice {
  font-size: 0.75rem;
  color: #94A3B8;
  text-align: right;
  display: block;
}

/* Coupon Box */
.cart-coupon-box {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.cart-coupon-form {
  display: flex;
  gap: 0.5rem;
}

.cart-coupon-input {
  flex: 1;
  padding: 0.65rem 0.85rem;
  border: 1px solid #CBD5E1;
  border-radius: 8px;
  font-size: 0.88rem;
  text-transform: uppercase;
  outline: none;
  background-color: #ffffff;
}

.cart-coupon-input:focus {
  border-color: #165B2E;
}

.cart-coupon-btn {
  padding: 0.65rem 1.15rem;
  background-color: #ffffff;
  border: 1.5px solid #165B2E;
  color: #165B2E;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.2s;
}

.cart-coupon-btn:hover {
  background-color: #165B2E;
  color: #ffffff;
}

.cart-coupon-hint {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  color: #64748B;
  margin: 0;
}

/* Primary Checkout Button */
.cart-checkout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 0.95rem 1.5rem;
  background-color: #165B2E;
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-size: 1.05rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(22, 91, 46, 0.25);
  transition: all 0.2s ease;
}

.cart-checkout-btn:hover:not(:disabled) {
  background-color: #0F4726;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(22, 91, 46, 0.35);
}

.cart-checkout-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: #94A3B8;
  box-shadow: none;
}

/* Trust Badges */
.cart-trust-badges {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  padding-top: 0.5rem;
}

.cart-trust-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
}

.cart-trust-icon {
  color: #165B2E;
  flex-shrink: 0;
}

/* Responsive Breakpoints */
@media (max-width: 960px) {
  .cart-main-grid {
    grid-template-columns: 1fr;
  }

  .cart-right-col {
    position: static;
  }
}

@media (max-width: 720px) {
  .cart-table-head {
    display: none;
  }

  .cart-table-row {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1.25rem 1rem;
  }

  .cart-price-cell,
  .cart-total-cell {
    align-items: flex-start;
    text-align: left;
    justify-content: flex-start;
  }
}
`;

fs.writeFileSync(cssPath, cssContent, 'utf8');
console.log('✅ Overwritten CartPage.css with clean, pixel-perfect alignment styles!');
