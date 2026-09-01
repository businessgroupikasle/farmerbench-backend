const fs = require('fs');
const filePath = '../farmer_frontend/src/pages/ProductDetailPage.tsx';
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('getUploadUrl')) {
  content = content.replace(import './ProductDetailPage.css';, import { getUploadUrl } from '../utils/image';\nimport './ProductDetailPage.css';);
}

content = content.replace('<img src={img} alt=" />', '<img src={getUploadUrl(img, \'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800\')} alt= />');
content = content.replace('src={currentImage}', 'src={getUploadUrl(currentImage, \'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800\')}');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated ProductDetailPage.tsx');
