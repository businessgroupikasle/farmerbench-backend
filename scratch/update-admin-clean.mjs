import fs from 'fs';
import path from 'path';

const filePath = path.resolve('../farmer_frontend/src/pages/AdminPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add useAdminOrders import
if (!content.includes('useAdminOrders')) {
  content = content.replace(
    "import { useCustomers, useCustomerMutations } from '../hooks/useCustomers';",
    "import { useCustomers, useCustomerMutations } from '../hooks/useCustomers';\nimport { useAdminOrders, useOrderMutations } from '../hooks/useOrders';"
  );
}

// 2. Replace the hardcoded orders array and other mock data arrays with clean DB connection & empty defaults
const oldDataStatesRegex = /\/\/ 1\. Orders\s*const \[orders, setOrders\] = useState\([\s\S]*?\/\/ 4\. Coupons\s*const \[coupons, setCoupons\] = useState\([\s\S]*?\/\/ 5\. Service Bookings\s*const \[serviceBookings, setServiceBookings\] = useState\([\s\S]*?\/\/ 6\. Crop Doctor\s*const \[cropDoctorRequests, setCropDoctorRequests\] = useState\([\s\S]*?\/\/ 7\. Experts\s*const \[experts, setExperts\] = useState\([\s\S]*?\/\/ 8\. Reviews\s*const \[reviews, setReviews\] = useState\([\s\S]*?\/\/ 9\. Blogs\s*const \[blogs, setBlogs\] = useState\([\s\S]*?\/\/ 11\. Banners/;

const newDataStates = `// 1. Orders (Live Database Orders)
  const { data: adminOrdersData, refetch: refetchOrders } = useAdminOrders({ limit: 100 });
  const { updateOrderStatus } = useOrderMutations();

  const orders = (adminOrdersData?.orders || []).map((o: any) => ({
    id: o.id.length > 8 ? '#GL-' + o.id.slice(0, 5).toUpperCase() : o.id,
    realId: o.id,
    customer: o.user?.name || o.shippingAddress?.fullName || 'Customer',
    phone: o.user?.phone || o.shippingAddress?.phone || 'N/A',
    email: o.user?.email || 'N/A',
    products: (o.items?.length || 1) + ' items (' + (o.items?.map((it: any) => it.title).join(', ') || 'Agricultural inputs') + ')',
    amount: '₹' + (o.totalPrice || o.itemsPrice || 0).toLocaleString('en-IN'),
    payment: o.paymentStatus === 'PAID' ? 'Paid' : o.paymentStatus === 'FAILED' ? 'Failed' : 'Pending',
    paymentClass: (o.paymentStatus || 'pending').toLowerCase(),
    status: o.orderStatus ? (o.orderStatus.charAt(0) + o.orderStatus.slice(1).toLowerCase()) : 'Pending',
    statusClass: (o.orderStatus || 'pending').toLowerCase(),
    date: new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    items: o.items?.map((it: any) => ({ name: it.title, qty: it.quantity, price: '₹' + it.price })) || [],
    shippingAddress: o.shippingAddress ? (o.shippingAddress.street + ', ' + o.shippingAddress.city + ', ' + o.shippingAddress.state + ' - ' + o.shippingAddress.postalCode) : 'Standard Shipping Address',
  }));

  // 4. Coupons
  const [coupons, setCoupons] = useState<any[]>([]);

  // 5. Service Bookings
  const [serviceBookings, setServiceBookings] = useState<any[]>([]);

  // 6. Crop Doctor
  const [cropDoctorRequests, setCropDoctorRequests] = useState<any[]>([]);

  // 7. Experts
  const [experts, setExperts] = useState<any[]>([]);

  // 8. Reviews
  const [reviews, setReviews] = useState<any[]>([]);

  // 9. Blogs
  const [blogs, setBlogs] = useState<any[]>([]);

  // 11. Banners`;

if (oldDataStatesRegex.test(content)) {
  content = content.replace(oldDataStatesRegex, newDataStates);
  console.log('Replaced data states successfully');
} else {
  console.error('Could not match oldDataStatesRegex');
}

// 3. Update handleUpdateOrderStatus to support database orders
const oldUpdateOrderHandlerRegex = /const handleUpdateOrderStatus = \(orderId: string, newStatus: string, newClass: string\) => \{[\s\S]*?\};/;
const newUpdateOrderHandler = `const handleUpdateOrderStatus = async (orderId: string, newStatus: string, _newClass: string) => {
    try {
      const target = orders.find((o) => o.id === orderId);
      const targetId = target?.realId || orderId;
      const dbStatus = newStatus.toUpperCase() as any;
      await updateOrderStatus({ id: targetId, data: { status: dbStatus } });
      refetchOrders();
      showToast('Order status updated to ' + newStatus);
    } catch (err: any) {
      showToast('Failed to update order status');
    }
  };`;

if (oldUpdateOrderHandlerRegex.test(content)) {
  content = content.replace(oldUpdateOrderHandlerRegex, newUpdateOrderHandler);
  console.log('Replaced handleUpdateOrderStatus successfully');
}

// 4. Add empty states for tables/grids if empty

// A. Orders table empty state
content = content.replace(
  '<tbody>\n                    {filteredOrders.map((ord) => (',
  `<tbody>
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748B' }}>
                          <ShoppingCart size={36} style={{ margin: '0 auto 0.6rem', opacity: 0.35, color: '#0F4726' }} />
                          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1E293B' }}>No orders found</div>
                          <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.2rem' }}>Customer orders placed on the storefront will appear here.</div>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((ord) => (`
);

// B. Recent Orders Dashboard empty state
content = content.replace(
  '<tbody>\n                        {orders.slice(0, 5).map((ord) => (',
  `<tbody>
                        {orders.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748B' }}>
                              <ShoppingCart size={28} style={{ margin: '0 auto 0.4rem', opacity: 0.3, color: '#0F4726' }} />
                              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>No recent orders</div>
                              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>New orders will appear here automatically.</div>
                            </td>
                          </tr>
                        ) : (
                          orders.slice(0, 5).map((ord) => (`
);

// C. Coupons table empty state
content = content.replace(
  '<tbody>\n                    {coupons.map((coup) => (',
  `<tbody>
                    {coupons.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748B' }}>
                          <TicketPercent size={36} style={{ margin: '0 auto 0.6rem', opacity: 0.35, color: '#0F4726' }} />
                          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1E293B' }}>No coupons created yet</div>
                          <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.2rem' }}>Click "+ Create Coupon" above to create promotional discount vouchers.</div>
                        </td>
                      </tr>
                    ) : (
                      coupons.map((coup) => (`
);

// D. Service Bookings table empty state
content = content.replace(
  '<tbody>\n                    {serviceBookings.map((b) => (',
  `<tbody>
                    {serviceBookings.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748B' }}>
                          <CalendarCheck size={36} style={{ margin: '0 auto 0.6rem', opacity: 0.35, color: '#0F4726' }} />
                          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1E293B' }}>No service bookings recorded</div>
                          <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.2rem' }}>Farm visit and soil testing consultation bookings will appear here.</div>
                        </td>
                      </tr>
                    ) : (
                      serviceBookings.map((b) => (`
);

// E. Crop Doctor grid empty state
content = content.replace(
  '<div style={{ display: \'grid\', gridTemplateColumns: \'repeat(auto-fill, minmax(340px, 1fr))\', gap: \'1.25rem\' }}>\n                {cropDoctorRequests.map((cd) => (',
  `<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
                {cropDoctorRequests.length === 0 ? (
                  <div className="admin-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3.5rem 1rem', color: '#64748B' }}>
                    <Stethoscope size={36} style={{ margin: '0 auto 0.6rem', opacity: 0.35, color: '#0F4726' }} />
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1E293B' }}>No crop health inquiries</div>
                    <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.2rem' }}>Farmer crop disease photos and advisory requests will appear here for prescription.</div>
                  </div>
                ) : (
                  cropDoctorRequests.map((cd) => (`
);

// F. Experts grid empty state
content = content.replace(
  '<div className="admin-experts-grid">\n                {experts.map((exp) => (',
  `<div className="admin-experts-grid">
                {experts.length === 0 ? (
                  <div className="admin-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3.5rem 1rem', color: '#64748B' }}>
                    <GraduationCap size={36} style={{ margin: '0 auto 0.6rem', opacity: 0.35, color: '#0F4726' }} />
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1E293B' }}>No agronomists registered yet</div>
                    <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.2rem' }}>Click "+ Register Expert" above to add agronomists and territory specialists.</div>
                  </div>
                ) : (
                  experts.map((exp) => (`
);

// G. Reviews list empty state
content = content.replace(
  '<div>\n                {reviews.map((rev) => (',
  `<div>
                {reviews.length === 0 ? (
                  <div className="admin-card" style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748B' }}>
                    <MessageSquareQuote size={36} style={{ margin: '0 auto 0.6rem', opacity: 0.35, color: '#0F4726' }} />
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1E293B' }}>No customer reviews submitted yet</div>
                    <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.2rem' }}>Farmer ratings, reviews, and field proof photos will appear here for moderation.</div>
                  </div>
                ) : (
                  reviews.map((rev) => (`
);

// H. Blog table empty state
content = content.replace(
  '<tbody>\n                    {blogs.map((b) => (',
  `<tbody>
                    {blogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748B' }}>
                          <BookOpen size={36} style={{ margin: '0 auto 0.6rem', opacity: 0.35, color: '#0F4726' }} />
                          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1E293B' }}>No blog articles published yet</div>
                          <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.2rem' }}>Click "+ Write New Article" above to publish agronomic guides and seasonal tips.</div>
                        </td>
                      </tr>
                    ) : (
                      blogs.map((b) => (`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated AdminPage.tsx with clean real data & empty states');
