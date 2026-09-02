const fs = require('fs');
const path = require('path');

const cssPath = path.resolve(__dirname, '../../farmer_frontend/src/pages/CheckoutPage.css');

const cssContent = `/* ==========================================================================
   FARMERBENCH CHECKOUT & PAYMENT PAGE STYLES
   ========================================================================== */

.checkout-page-container {
  max-width: 1120px;
  margin: 0 auto;
  padding: 2rem 1.25rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  font-family: inherit;
}

/* 1. Breadcrumb */
.checkout-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #64748B;
}

.checkout-breadcrumb-link {
  color: #64748B;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.checkout-breadcrumb-link:hover {
  color: #15803D;
}

.checkout-breadcrumb-separator {
  color: #CBD5E1;
}

.checkout-breadcrumb-current {
  color: #1E293B;
  font-weight: 700;
}

/* 2. Stepper Progress Bar */
.checkout-stepper-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 0.5rem 0 1.5rem;
}

.checkout-stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 520px;
}

.checkout-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  position: relative;
  z-index: 2;
  cursor: default;
}

.checkout-step-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #F1F5F9;
  border: 2px solid #CBD5E1;
  color: #64748B;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 800;
  transition: all 0.3s ease;
}

.checkout-step.active .checkout-step-circle {
  background-color: #15803D;
  border-color: #15803D;
  color: #ffffff;
  box-shadow: 0 0 0 4px rgba(21, 128, 61, 0.18);
}

.checkout-step.done .checkout-step-circle {
  background-color: #15803D;
  border-color: #15803D;
  color: #ffffff;
}

.checkout-step-label {
  font-size: 0.825rem;
  font-weight: 700;
  color: #94A3B8;
  letter-spacing: 0.02em;
  transition: color 0.3s ease;
}

.checkout-step.active .checkout-step-label,
.checkout-step.done .checkout-step-label {
  color: #15803D;
}

.checkout-step-line {
  flex: 1;
  height: 3px;
  background-color: #E2E8F0;
  margin: 0 12px;
  margin-bottom: 1.4rem;
  border-radius: 2px;
  transition: background-color 0.3s ease;
}

.checkout-step-line.done {
  background-color: #15803D;
}

/* 3. Main Grid */
.checkout-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 2rem;
  align-items: start;
}

/* 4. Left Form Card */
.checkout-card {
  background-color: #ffffff;
  border: 1px solid #E2E8F0;
  border-radius: 18px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.checkout-card-header {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #F1F5F9;
}

.checkout-card-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background-color: #F0FDF4;
  color: #15803D;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.checkout-card-title {
  font-size: 1.3rem;
  font-weight: 800;
  color: #0F4726;
  margin: 0;
}

.checkout-card-subtitle {
  font-size: 0.85rem;
  color: #64748B;
  margin: 0.2rem 0 0;
}

/* Form Groups & Inputs */
.checkout-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.checkout-form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  width: 100%;
}

.checkout-form-row-3 {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr;
  gap: 1rem;
  width: 100%;
}

.checkout-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  width: 100%;
}

.checkout-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: #334155;
  display: block;
}

.checkout-input,
.checkout-select,
.checkout-textarea {
  width: 100%;
  padding: 0.8rem 1rem;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  font-size: 0.925rem;
  color: #1E293B;
  background-color: #F8FAFC;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;
  font-family: inherit;
}

.checkout-input:focus,
.checkout-select:focus,
.checkout-textarea:focus {
  background-color: #ffffff;
  border-color: #15803D;
  box-shadow: 0 0 0 3.5px rgba(21, 128, 61, 0.12);
}

.checkout-input::placeholder,
.checkout-textarea::placeholder {
  color: #94A3B8;
}

/* Delivery Address Summary Bar */
.checkout-deliver-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  background-color: #F8FAFC;
  border: 1px solid #E2E8F0;
}

.checkout-deliver-label {
  font-size: 0.725rem;
  font-weight: 800;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: block;
}

.checkout-deliver-name {
  font-size: 0.95rem;
  font-weight: 800;
  color: #1E293B;
  margin: 0.2rem 0 0;
}

.checkout-deliver-address {
  font-size: 0.825rem;
  color: #64748B;
  margin: 0.15rem 0 0;
}

.checkout-edit-btn {
  padding: 0.4rem 0.85rem;
  border-radius: 8px;
  border: 1px solid #CBD5E1;
  background-color: #ffffff;
  color: #334155;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  transition: all 0.2s;
}

.checkout-edit-btn:hover {
  background-color: #F1F5F9;
  border-color: #94A3B8;
}

/* Payment Option Cards */
.checkout-payment-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.checkout-payment-card {
  display: flex;
  align-items: flex-start;
  gap: 1.15rem;
  padding: 1.35rem;
  border-radius: 14px;
  border: 1.5px solid #E2E8F0;
  background-color: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.checkout-payment-card.active {
  border-color: #15803D;
  background-color: #F0FDF4;
  box-shadow: 0 4px 14px rgba(21, 128, 61, 0.08);
}

.checkout-radio {
  accent-color: #15803D;
  margin-top: 0.25rem;
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkout-badge-pill {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  background-color: #DCFCE7;
  color: #15803D;
}

.checkout-method-tag {
  font-size: 0.725rem;
  font-weight: 600;
  padding: 0.25rem 0.55rem;
  background-color: #ffffff;
  border: 1px solid #CBD5E1;
  border-radius: 6px;
  color: #334155;
}

/* Form Action Buttons */
.checkout-actions-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid #F1F5F9;
}

.checkout-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.85rem 1.35rem;
  border-radius: 12px;
  border: 1.5px solid #CBD5E1;
  background-color: #ffffff;
  color: #475569;
  font-weight: 700;
  font-size: 0.925rem;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s;
}

.checkout-back-btn:hover {
  background-color: #F8FAFC;
  border-color: #94A3B8;
  color: #1E293B;
}

.checkout-submit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.95rem 2rem;
  border-radius: 12px;
  border: none;
  background-color: #15803D;
  color: #ffffff;
  font-weight: 800;
  font-size: 1.05rem;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(21, 128, 61, 0.3);
  transition: all 0.2s ease;
}

.checkout-submit-btn:hover:not(:disabled) {
  background-color: #0F4726;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(21, 128, 61, 0.4);
}

.checkout-submit-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  background-color: #94A3B8;
  box-shadow: none;
}

/* Responsive */
@media (max-width: 960px) {
  .checkout-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .checkout-form-row-2,
  .checkout-form-row-3 {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .checkout-card {
    padding: 1.25rem;
  }

  .checkout-actions-row {
    flex-direction: column-reverse;
  }

  .checkout-back-btn,
  .checkout-submit-btn {
    width: 100%;
    justify-content: center;
  }
}
`;

fs.writeFileSync(cssPath, cssContent, 'utf8');
console.log('Successfully created CheckoutPage.css');
