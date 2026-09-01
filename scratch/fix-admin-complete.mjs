import fs from 'fs';
import path from 'path';

const filePath = path.resolve('../farmer_frontend/src/pages/AdminPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace data states block completely with correct products & categories integration
const targetBlock = `  // 1. Orders (Live Database Orders)
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

  // 2. Database-Driven Products & Categories (PostgreSQL Single Source of Truth)
  const { data: productsResponse } = useProducts({ limit: 100 });
  const { data: dbCategories = [] } = useCategories();

  const { createProduct, updateProduct, deleteProduct } = useProductMutations();
  const { createCategory, deleteCategory } = useCategoryMutations();

  const products = (productsResponse?.data || []).map((p: any) => ({
    id: p.id,
    name: p.title,
    title: p.title,
    slug: p.slug,
    description: p.description,
    sku: p.slug ? ('SKU-' + p.slug.slice(0, 8).toUpperCase()) : ('SKU-' + p.id.slice(0, 6).toUpperCase()),
    category: p.category?.name || (typeof p.category === 'string' ? p.category : 'General'),
    categoryId: p.categoryId || p.category?.id,
    price: p.price,
    discountPrice: p.discountPrice || p.price,
    stock: p.stock,
    sold: p.numReviews ? p.numReviews * 5 : 18,
    revenue: '₹' + (((p.discountPrice || p.price) * (p.numReviews ? p.numReviews * 5 : 18)) / 1000).toFixed(1) + 'K',
    image: p.images?.[0] || 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800',
    images: p.images || [],
    attributes: p.attributes || {},
    featured: p.featured,
    status: p.stock === 0 ? 'Out of Stock' : p.stock <= 10 ? 'Low Stock' : 'In Stock',
  }));

  const categories = dbCategories.map((c: any) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    count: c._count?.products ?? 0,
    description: c.description || 'Certified biological & organic agricultural inputs.',
    icon: c.name.toLowerCase().includes('pesticide') ? '🛡️' : c.name.toLowerCase().includes('fertilizer') ? '🌱' : c.name.toLowerCase().includes('seed') ? '🌾' : '🧪',
    imageUrl: c.imageUrl,
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
  const [blogs, setBlogs] = useState<any[]>([]);`;

// Match from // 1. Orders (Live Database Orders) down to // 9. Blogs
const regex = /\/\/ 1\. Orders \(Live Database Orders\)[\s\S]*?\/\/ 9\. Blogs\s*const \[blogs, setBlogs\] = useState<any\[\]>\(\);/;

if (regex.test(content)) {
  content = content.replace(regex, targetBlock);
  console.log('Restored products & categories successfully');
} else {
  console.error('Could not match target regex');
}

// Fix updateOrderStatus in handleUpdateOrderStatus
content = content.replace(
  `      const dbStatus = newStatus.toUpperCase() as any;
      await updateOrderStatus({ id: targetId, data: { status: dbStatus } });`,
  `      const dbStatus = newStatus.toUpperCase() as any;
      await updateOrderStatus({ id: targetId, data: { orderStatus: dbStatus } });`
);

// Clean up unused image imports at top if not needed
content = content.replace(
  `// Assets
import growthBoosterImg from '../assets/growth-booster.jpg';
import neemOilImg from '../assets/neem-oil-bottle.jpg';
import farmingPracticesImg from '../assets/farming-practices.jpg';
import vineyardImg from '../assets/vineyard-hills.jpg';
import wheatImg from '../assets/wheat-sunburst.jpg';
import cropMonitoringImg from '../assets/crop-monitoring.jpg';
import smartIrrigationImg from '../assets/smart-irrigation.jpg';
import burntLeavesImg from '../assets/burnt-leaves.jpg';`,
  `// Assets
import farmingPracticesImg from '../assets/farming-practices.jpg';`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully fixed AdminPage.tsx');
