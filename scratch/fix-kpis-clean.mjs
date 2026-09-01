import fs from 'fs';
import path from 'path';

// 1. Update AdminPage.tsx
const adminFilePath = path.resolve('../farmer_frontend/src/pages/AdminPage.tsx');
let adminContent = fs.readFileSync(adminFilePath, 'utf8');

// Insert totalRevenue calculation right below orders mapping
if (!adminContent.includes('const totalRevenue =')) {
  adminContent = adminContent.replace(
    `  // 2. Database-Driven Products & Categories (PostgreSQL Single Source of Truth)`,
    `  const totalRevenue = orders.reduce((sum: number, o: any) => {
    const cleanAmount = parseFloat(String(o.amount).replace(/[^0-9.]/g, '')) || 0;
    return sum + cleanAmount;
  }, 0);

  // 2. Database-Driven Products & Categories (PostgreSQL Single Source of Truth)`
  );
}

// Replace KPI cards in Admin Dashboard
const oldKpisRegex = /<div className="admin-kpi-grid">[\s\S]*?{'\/\* MIDDLE ROW: REVENUE OVERVIEW, ORDER STATUS & ALERT CARDS \*\/}/;
const newKpis = `<div className="admin-kpi-grid">
                <div className="admin-kpi-card" onClick={() => setActiveNav('Reports')} style={{ cursor: 'pointer' }}>
                  <div className="admin-kpi-top">
                    <div className="admin-kpi-icon-wrap bg-rev">
                      <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>₹</span>
                    </div>
                    <div className="admin-kpi-meta">
                      <span className="admin-kpi-label">Total Revenue</span>
                      <span className="admin-kpi-value">₹{totalRevenue.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <div className="admin-kpi-bottom">
                    <span className="admin-kpi-trend"><TrendingUp size={13} /> {orders.length} orders</span>
                    <svg className="admin-kpi-sparkline" viewBox="0 0 60 20" fill="none">
                      <path d="M 2 16 Q 15 4, 28 14 T 58 6" stroke="#16A34A" strokeWidth="2" fill="none" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                <div className="admin-kpi-card" onClick={() => setActiveNav('Orders')} style={{ cursor: 'pointer' }}>
                  <div className="admin-kpi-top">
                    <div className="admin-kpi-icon-wrap bg-ord"><ShoppingCart size={20} /></div>
                    <div className="admin-kpi-meta">
                      <span className="admin-kpi-label">Total Orders</span>
                      <span className="admin-kpi-value">{orders.length}</span>
                    </div>
                  </div>
                  <div className="admin-kpi-bottom">
                    <span className="admin-kpi-trend"><TrendingUp size={13} /> {orders.filter((o: any) => o.status === 'Processing' || o.status === 'Pending').length} active</span>
                    <svg className="admin-kpi-sparkline" viewBox="0 0 60 20" fill="none">
                      <path d="M 2 15 Q 18 18, 30 8 T 58 7" stroke="#16A34A" strokeWidth="2" fill="none" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                <div className="admin-kpi-card" onClick={() => setActiveNav('Products')} style={{ cursor: 'pointer' }}>
                  <div className="admin-kpi-top">
                    <div className="admin-kpi-icon-wrap bg-prd"><Package size={20} /></div>
                    <div className="admin-kpi-meta">
                      <span className="admin-kpi-label">Products</span>
                      <span className="admin-kpi-value">{products.length}</span>
                    </div>
                  </div>
                  <div className="admin-kpi-bottom">
                    <span className="admin-kpi-trend"><TrendingUp size={13} /> {products.filter((p: any) => p.stock > 0).length} in stock</span>
                    <svg className="admin-kpi-sparkline" viewBox="0 0 60 20" fill="none">
                      <path d="M 2 17 Q 15 15, 32 10 T 58 5" stroke="#16A34A" strokeWidth="2" fill="none" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                <div className="admin-kpi-card" onClick={() => setActiveNav('Customers')} style={{ cursor: 'pointer' }}>
                  <div className="admin-kpi-top">
                    <div className="admin-kpi-icon-wrap bg-cst"><Users size={20} /></div>
                    <div className="admin-kpi-meta">
                      <span className="admin-kpi-label">Customers</span>
                      <span className="admin-kpi-value">{customers.length}</span>
                    </div>
                  </div>
                  <div className="admin-kpi-bottom">
                    <span className="admin-kpi-trend"><TrendingUp size={13} /> {customers.length} verified</span>
                    <svg className="admin-kpi-sparkline" viewBox="0 0 60 20" fill="none">
                      <path d="M 2 18 Q 20 12, 38 11 T 58 4" stroke="#16A34A" strokeWidth="2" fill="none" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                <div className="admin-kpi-card" onClick={() => setActiveNav('Service Bookings')} style={{ cursor: 'pointer' }}>
                  <div className="admin-kpi-top">
                    <div className="admin-kpi-icon-wrap bg-srv"><CalendarCheck size={20} /></div>
                    <div className="admin-kpi-meta">
                      <span className="admin-kpi-label">Service Bookings</span>
                      <span className="admin-kpi-value">{serviceBookings.length}</span>
                    </div>
                  </div>
                  <div className="admin-kpi-bottom">
                    <span className="admin-kpi-trend"><TrendingUp size={13} /> {serviceBookings.length} scheduled</span>
                    <svg className="admin-kpi-sparkline" viewBox="0 0 60 20" fill="none">
                      <path d="M 2 16 Q 16 6, 32 12 T 58 4" stroke="#16A34A" strokeWidth="2" fill="none" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* MIDDLE ROW: REVENUE OVERVIEW, ORDER STATUS & ALERT CARDS */}`;

adminContent = adminContent.replace(oldKpisRegex, newKpis);

// Replace Chart legend in Revenue Overview
adminContent = adminContent.replace(
  `<span>Revenue <strong>₹8.42L</strong></span>`,
  `<span>Revenue <strong>₹{totalRevenue.toLocaleString('en-IN')}</strong></span>`
);
adminContent = adminContent.replace(
  `<span>Orders <strong>1,248</strong></span>`,
  `<span>Orders <strong>{orders.length}</strong></span>`
);

// Replace Reports tab KPI cards
adminContent = adminContent.replace(
  `<span className="admin-kpi-value">₹8,42,560</span>`,
  `<span className="admin-kpi-value">₹{totalRevenue.toLocaleString('en-IN')}</span>`
);
adminContent = adminContent.replace(
  `<span className="admin-kpi-value">1,248</span>`,
  `<span className="admin-kpi-value">{orders.filter((o: any) => o.status === 'Delivered').length}</span>`
);
adminContent = adminContent.replace(
  `<span className="admin-kpi-value">₹675</span>`,
  `<span className="admin-kpi-value">₹{orders.length ? Math.round(totalRevenue / orders.length).toLocaleString('en-IN') : 0}</span>`
);

fs.writeFileSync(adminFilePath, adminContent, 'utf8');
console.log('Successfully updated AdminPage.tsx KPIs with dynamic live values');

// 2. Update CartPage.tsx
const cartFilePath = path.resolve('../farmer_frontend/src/pages/CartPage.tsx');
let cartContent = fs.readFileSync(cartFilePath, 'utf8');

// Replace savedItems and hardcoded default coupons/pincode
cartContent = cartContent.replace(
  /\/\/ Saved for Later items[\s\S]*?const \[savedItems, setSavedItems\] = useState<SavedItemData\[\]>\([\s\S]*?\]\);/,
  `// Saved for Later items\n  const [savedItems, setSavedItems] = useState<SavedItemData[]>([]);`
);

cartContent = cartContent.replace(
  `  const [couponCode, setCouponCode] = useState('FARMERBENCH120');\n  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(subtotal >= 500 ? 'FARMERBENCH120' : null);\n  const [discountAmount, setDiscountAmount] = useState(subtotal >= 500 ? 120 : 0);`,
  `  const [couponCode, setCouponCode] = useState('');\n  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);\n  const [discountAmount, setDiscountAmount] = useState(0);`
);

cartContent = cartContent.replace(
  `  const [pincode, setPincode] = useState('641001');\n  const [deliveryChecked, setDeliveryChecked] = useState(true);`,
  `  const [pincode, setPincode] = useState('');\n  const [deliveryChecked, setDeliveryChecked] = useState(false);`
);

fs.writeFileSync(cartFilePath, cartContent, 'utf8');
console.log('Successfully cleaned CartPage.tsx mock saved items and default coupon');
