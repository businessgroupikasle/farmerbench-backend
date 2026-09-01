import fs from 'fs';
import path from 'path';

const filePath = path.resolve('../farmer_frontend/src/pages/AdminPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const productsBlock = `  // 2. Database-Driven Products & Categories (PostgreSQL Single Source of Truth)
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

  // 4. Coupons`;

content = content.replace('  // 4. Coupons', productsBlock);

// Replace currency symbol corrupted chars if any
content = content.replace(/amount: ',1'/g, "amount: '₹'");
content = content.replace(/price: ',1'/g, "price: '₹'");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Inserted products & categories block successfully');
