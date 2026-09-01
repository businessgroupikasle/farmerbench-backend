import fs from 'fs';
import path from 'path';

const filePath = path.resolve('../farmer_frontend/src/services/blog.service.ts');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  'const res = await apiClient.get(\'/blogs\', { params });\n      if (res?.data && Array.isArray(res.data.blogs)) {\n        return res;',
  'const res: any = await apiClient.get(\'/blogs\', { params });\n      if (res?.data && Array.isArray(res.data.blogs)) {\n        return res;'
);

content = content.replace(
  'const res = await apiClient.get(`/blogs/${idOrSlug}`);\n      if (res?.data && res.data.id) {\n        return res;',
  'const res: any = await apiClient.get(`/blogs/${idOrSlug}`);\n      if (res?.data && res.data.id) {\n        return res;'
);

content = content.replace(
  'const res = await apiClient.get(`/blogs/${idOrSlug}/related`, { params: { limit } });\n      if (res?.data && Array.isArray(res.data)) {\n        return res;',
  'const res: any = await apiClient.get(`/blogs/${idOrSlug}/related`, { params: { limit } });\n      if (res?.data && Array.isArray(res.data)) {\n        return res;'
);

content = content.replace(
  'const res = await apiClient.post(\'/blogs\', data);\n      if (res?.data && res.data.id) {\n        return res;',
  'const res: any = await apiClient.post(\'/blogs\', data);\n      if (res?.data && res.data.id) {\n        return res;'
);

content = content.replace(
  'const res = await apiClient.put(`/blogs/${id}`, data);\n      if (res?.data && res.data.id) {\n        return res;',
  'const res: any = await apiClient.put(`/blogs/${id}`, data);\n      if (res?.data && res.data.id) {\n        return res;'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed blog.service.ts return types');
