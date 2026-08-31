const fs = require('fs');
const path = require('path');

const cartPagePath = path.resolve(__dirname, '../../farmer_frontend/src/pages/CartPage.tsx');
let content = fs.readFileSync(cartPagePath, 'utf8');

// Ensure Minus and Plus are imported from lucide-react
if (!content.includes('Minus,')) {
  content = content.replace(
    '  Trash2,\n',
    '  Trash2,\n  Minus,\n  Plus,\n'
  );
}

// Replace corrupted currency characters with ₹
content = content.replace(/\uFFFD\u002C1/g, '₹');
content = content.replace(/,1/g, '₹');
content = content.replace(/\^'/g, '−');
content = content.replace(/\uFFFD\^'/g, '−');
content = content.replace(//g, '');

fs.writeFileSync(cartPagePath, content, 'utf8');
console.log('✅ Cleaned currency symbols and quantity buttons in CartPage.tsx');
