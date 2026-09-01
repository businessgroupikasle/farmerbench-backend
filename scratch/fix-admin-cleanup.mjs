import fs from 'fs';
import path from 'path';

const filePath = path.resolve('../farmer_frontend/src/pages/AdminPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Clean unused mock image imports
content = content.replace(
  `// Assets
import growthBoosterImg from '../assets/growth-booster.jpg';
import neemOilImg from '../assets/neem-oil-bottle.jpg';
import farmingPracticesImg from '../assets/farming-practices.jpg';
import vineyardImg from '../assets/vineyard-hills.jpg';
import wheatImg from '../assets/wheat-sunburst.jpg';
import cropMonitoringImg from '../assets/crop-monitoring.jpg';
import smartIrrigationImg from '../assets/smart-irrigation.jpg';
import burntLeavesImg from '../assets/burnt-leaves.jpg';
import farmerLogo from '../assets/farmerbench-logo.png';`,
  `// Assets
import farmerLogo from '../assets/farmerbench-logo.png';`
);

// Fix photos typing in reviews
content = content.replace(
  `{rev.photos.map((ph, idx) => (`,
  `{rev.photos?.map((ph: string, idx: number) => (`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Cleaned unused imports and fixed reviews typing');
