import fs from 'fs';
import path from 'path';

const filePath = path.resolve('../farmer_frontend/src/pages/AdminPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const duplicateCustomerBlock = `  // Customers Management from Database
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
  }));`;

content = content.replace(duplicateCustomerBlock, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Removed duplicate customer block');
