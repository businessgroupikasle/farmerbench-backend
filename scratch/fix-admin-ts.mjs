import fs from 'fs';
import path from 'path';

const filePath = path.resolve('../farmer_frontend/src/pages/AdminPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  `      if (res?.data?.url) {
        setCmsForm((prev: any) => {
          const updated = [...prev.images];
          updated[index] = res.data.url;
          return { ...prev, images: updated };
        });
        addToast({ type: 'success', message: 'Gallery image replaced successfully' });
      }`,
  `      if (res?.data?.url) {
        const newUrl = res.data.url;
        setCmsForm((prev: any) => {
          const updated = [...prev.images];
          updated[index] = newUrl;
          return { ...prev, images: updated };
        });
        addToast({ type: 'success', message: 'Gallery image replaced successfully' });
      }`
);

content = content.replace(
  `          if (res?.data?.url) {
            successfullyUploaded.push(res.data.url);
          }`,
  `          if (res?.data?.url) {
            const url = res.data.url;
            successfullyUploaded.push(url);
          }`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed closure typing in AdminPage.tsx');
