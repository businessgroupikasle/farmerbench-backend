const fs = require('fs');
const path = require('path');

const checkoutPagePath = path.resolve(__dirname, '../../farmer_frontend/src/pages/CheckoutPage.tsx');
let content = fs.readFileSync(checkoutPagePath, 'utf8');

content = content.replace(
  '  CheckCircle2,\n',
  '  CheckCircle2,\n  Check,\n'
);

fs.writeFileSync(checkoutPagePath, content, 'utf8');
console.log('✅ Added Check to lucide-react in CheckoutPage.tsx');
