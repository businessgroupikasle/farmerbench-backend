const fs = require('fs');
const path = require('path');

const adminPagePath = path.resolve(__dirname, '../../farmer_frontend/src/pages/AdminPage.tsx');
let content = fs.readFileSync(adminPagePath, 'utf8');

content = content.replace('  const { createCustomer, updateCustomer } = useCustomerMutations();\n', '');
content = content.replace('  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);\n', '');
content = content.replace('  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);\n', '');
content = content.replace('  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);\n', '');

fs.writeFileSync(adminPagePath, content, 'utf8');
console.log('✅ Cleaned unused vars in AdminPage.tsx');
