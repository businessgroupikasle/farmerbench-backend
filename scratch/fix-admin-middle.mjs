import fs from 'fs';
import path from 'path';

const filePath = path.resolve('../farmer_frontend/src/pages/AdminPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Match from openAddProductCMS down to // 1. Orders (Live Database Orders)
const regex = /const openAddProductCMS = \(\) => \{[\s\S]*?\/\/ 1\. Orders \(Live Database Orders\)/;

const replacement = `const openAddProductCMS = () => {
    setCmsTab('basic');
    setCmsForm({
      title: '',
      slug: '',
      categoryId: dbCategories[0]?.id || '',
      price: 500,
      discountPrice: 450,
      stock: 50,
      featured: false,
      description: 'High-potency bio-formulation crafted for superior crop yield, enhanced root growth, and soil health.',
      images: ['https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800'],
      features: ['Promotes faster and healthier growth', 'Improves flowering and crop yield'],
      packSizes: ['500 g', '1 kg', '5 kg'],
      benefits: ['Accelerates vegetative branching and root formation.', 'Increases tillering and fruit set.'],
      usageSteps: [
        { stepNumber: 1, title: 'Measure', description: 'Take the recommended amount as per dosage.' },
        { stepNumber: 2, title: 'Mix', description: 'Mix with water thoroughly until dissolved.' },
        { stepNumber: 3, title: 'Apply', description: 'Apply to soil or as foliar spray to plants.' },
      ],
      dosageTable: [
        { crop: 'Paddy & Cereals', foliarSpray: '2.5 ml / Litre', dripIrrigation: '500 ml / Acre' },
        { crop: 'Vegetables', foliarSpray: '2.0 ml / Litre', dripIrrigation: '500 ml / Acre' },
      ],
      ingredients: 'Cold-fermented seaweed extract, amino acids, and micronutrient chelates.',
      specifications: [
        { label: 'Product Type', value: 'Organic' },
        { label: 'Form', value: 'Granular' },
        { label: 'Suitable Crops', value: 'All Crops' },
        { label: 'Application Method', value: 'Soil Application / Foliar Spray' },
        { label: 'Shelf Life', value: '24 Months' },
        { label: 'Manufacturer', value: 'FarmerBench Agri Solutions' },
      ],
      faqs: [
        { question: 'Can I use this product in drip irrigation?', answer: 'Yes, 100% water soluble and does not clog emitters.' },
      ],
      beforeAfter: {
        beforeImage: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800',
        afterImage: 'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?w=800',
        beforeTag: 'Before',
        afterTag: 'After 30 Days',
        disclaimer: '*Results may vary depending on crop variety and soil conditions.',
      },
    });
    setIsAddProductOpen(true);
  };

  const openEditProductCMS = (prod: any) => {
    setSelectedProduct(prod);
    setCmsTab('basic');
    const attrs = prod.attributes || {};
    setCmsForm({
      id: prod.id,
      title: prod.title || prod.name,
      slug: prod.slug,
      categoryId: prod.categoryId || dbCategories[0]?.id || '',
      price: prod.price,
      discountPrice: prod.discountPrice || prod.price,
      stock: prod.stock,
      featured: Boolean(prod.featured),
      description: prod.description || '',
      images: prod.images && prod.images.length > 0 ? prod.images : [prod.image],
      features: Array.isArray(attrs.features) && attrs.features.length > 0 ? attrs.features : ['Promotes faster and healthier growth'],
      packSizes: Array.isArray(attrs.packSizes) && attrs.packSizes.length > 0 ? attrs.packSizes : ['500 g', '1 kg', '5 kg'],
      benefits: Array.isArray(attrs.benefits) && attrs.benefits.length > 0 ? attrs.benefits : ['Accelerates vegetative branching and root formation.'],
      usageSteps: Array.isArray(attrs.usageSteps) && attrs.usageSteps.length > 0 ? attrs.usageSteps : [
        { stepNumber: 1, title: 'Measure', description: 'Take the recommended amount as per dosage.' },
        { stepNumber: 2, title: 'Mix', description: 'Mix with water thoroughly until dissolved.' },
        { stepNumber: 3, title: 'Apply', description: 'Apply to soil or as foliar spray to plants.' },
      ],
      dosageTable: Array.isArray(attrs.dosageTable) && attrs.dosageTable.length > 0 ? attrs.dosageTable : [
        { crop: 'Paddy & Cereals', foliarSpray: '2.5 ml / Litre', dripIrrigation: '500 ml / Acre' },
      ],
      ingredients: typeof attrs.ingredients === 'string' ? attrs.ingredients : 'Organic bio-stimulants and plant nutrients.',
      specifications: Array.isArray(attrs.specifications) && attrs.specifications.length > 0 ? attrs.specifications : [
        { label: 'Product Type', value: 'Organic' },
        { label: 'Form', value: 'Granular' },
      ],
      faqs: Array.isArray(attrs.faqs) && attrs.faqs.length > 0 ? attrs.faqs : [
        { question: 'Can I use this product in drip irrigation?', answer: 'Yes, 100% water soluble.' },
      ],
      beforeAfter: attrs.beforeAfter || {
        beforeImage: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800',
        afterImage: 'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?w=800',
        beforeTag: 'Before',
        afterTag: 'After 30 Days',
        disclaimer: '*Results may vary depending on crop variety and soil conditions.',
      },
    });
    setIsEditProductOpen(true);
  };

  // Customers Management from Database
  const { data: dbCustomers = [] } = useCustomers();
  const { createCustomer, updateCustomer, deleteCustomer } = useCustomerMutations();

  const customers = dbCustomers.map((c: any) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone || 'N/A',
    location: c.location || 'Tamil Nadu',
    crops: c.crops || 'Paddy & Vegetables',
    spent: '₹' + ((c._count?.orders || 1) * 3240).toLocaleString('en-IN'),
    orders: c._count?.orders || 0,
    status: c.status || 'Verified',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  }));

  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerStatusFilter, setCustomerStatusFilter] = useState('All');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');

  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [isExpertModalOpen, setIsExpertModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignBookingId, setAssignBookingId] = useState<string | null>(null);

  const [isCropReplyModalOpen, setIsCropReplyModalOpen] = useState(false);
  const [selectedCropItem, setSelectedCropItem] = useState<any>(null);
  const [cropPrescription, setCropPrescription] = useState('');

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // =========================================================================
  // DATA STATES
  // =========================================================================

  // 1. Orders (Live Database Orders)`;

content = content.replace(regex, replacement);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Restored middle functions and states in AdminPage.tsx');
