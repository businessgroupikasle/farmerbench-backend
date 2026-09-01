import fs from 'fs';
import path from 'path';

const filePath = path.resolve('../farmer_frontend/src/pages/AdminPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace all unused asset imports
const assetImportRegex = /\/\/ Assets[\s\S]*?import farmerLogo from '\.\.\/assets\/farmerbench-logo\.png';/;
content = content.replace(assetImportRegex, `// Assets\nimport farmerLogo from '../assets/farmerbench-logo.png';`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Cleaned asset imports successfully');
