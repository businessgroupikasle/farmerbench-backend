import fs from 'fs';
import path from 'path';

const filePath = path.resolve('../farmer_frontend/src/pages/AdminPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace('image: farmingPracticesImg,', "image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800',");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed blog default image');
