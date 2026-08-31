const fs = require('fs');
const path = require('path');

const checkoutPagePath = path.resolve(__dirname, '../../farmer_frontend/src/pages/CheckoutPage.tsx');
let content = fs.readFileSync(checkoutPagePath, 'utf8');

content = content.replace('  Sparkles,\n', '');
content = content.replace('  Check,\n', '');

fs.writeFileSync(checkoutPagePath, content, 'utf8');
console.log('✅ Cleaned unused imports in CheckoutPage.tsx');
