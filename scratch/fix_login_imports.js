const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../../farmer_frontend/src/pages/LoginPage.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Remove unused Award
content = content.replace('  Award,\n', '');

fs.writeFileSync(targetFile, content, 'utf8');
console.log('✅ Removed unused Award from LoginPage.tsx');
