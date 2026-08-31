const fs = require('fs');
const path = require('path');

const navbarPath = path.resolve(__dirname, '../../farmer_frontend/src/components/common/Navbar.tsx');
let navbarContent = fs.readFileSync(navbarPath, 'utf8');

navbarContent = navbarContent.replaceAll(
  '<span className="agriflow-cart-green-badge">{totalItems > 0 ? totalItems : 3}</span>',
  '<span className="agriflow-cart-green-badge">{totalItems}</span>'
);

fs.writeFileSync(navbarPath, navbarContent, 'utf8');
console.log('✅ Updated Navbar cart badge to show accurate live totalItems');
