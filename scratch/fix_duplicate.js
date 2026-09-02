const fs = require('fs');
const path = require('path');

const dashPath = path.resolve(__dirname, '../../farmer_frontend/src/pages/DashboardPage.tsx');
let dashContent = fs.readFileSync(dashPath, 'utf8');

dashContent = dashContent.replace(
  `  // Active Orders
  const activeOrdersList = orders.filter(
    (o) => o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED'
  );
  // Active Orders
  const activeOrdersList = orders.filter(
    (o) => o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED'
  );`,
  `  // Active Orders
  const activeOrdersList = orders.filter(
    (o) => o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED'
  );`
);

fs.writeFileSync(dashPath, dashContent, 'utf8');
console.log('Removed duplicate activeOrdersList declaration.');
