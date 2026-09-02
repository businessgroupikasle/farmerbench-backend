const fs = require('fs');
const path = require('path');

const dashPath = path.resolve(__dirname, '../../farmer_frontend/src/pages/DashboardPage.tsx');
let dashContent = fs.readFileSync(dashPath, 'utf8');

dashContent = dashContent.replace(
  '  const primaryActiveOrder = activeOrdersList[0] || null;',
  `  // Active Orders
  const activeOrdersList = orders.filter(
    (o) => o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED'
  );
  const primaryActiveOrder = activeOrdersList[0] || null;`
);

fs.writeFileSync(dashPath, dashContent, 'utf8');
console.log('Fixed activeOrdersList in DashboardPage.tsx');
