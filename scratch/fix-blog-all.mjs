import fs from 'fs';
import path from 'path';

// 1. Fix blog.service.ts
const blogServicePath = path.resolve('../farmer_frontend/src/services/blog.service.ts');
let blogServiceContent = fs.readFileSync(blogServicePath, 'utf8');

blogServiceContent = blogServiceContent.replace(
  `  async createBlog(data: CreateBlogInput): Promise<ApiResponse<BlogPost>> {
    const res = await apiClient.post('/blogs', data);
    return res;
  },`,
  `  async createBlog(data: CreateBlogInput): Promise<ApiResponse<BlogPost>> {
    const res: any = await apiClient.post('/blogs', data);
    return res;
  },`
);

blogServiceContent = blogServiceContent.replace(
  `  async updateBlog(id: string, data: UpdateBlogInput): Promise<ApiResponse<BlogPost>> {
    const res = await apiClient.put(\`/blogs/\${id}\`, data);
    return res;
  },`,
  `  async updateBlog(id: string, data: UpdateBlogInput): Promise<ApiResponse<BlogPost>> {
    const res: any = await apiClient.put(\`/blogs/\${id}\`, data);
    return res;
  },`
);

fs.writeFileSync(blogServicePath, blogServiceContent, 'utf8');
console.log('Fixed blog.service.ts');

// 2. Fix AdminPage.tsx
const adminFilePath = path.resolve('../farmer_frontend/src/pages/AdminPage.tsx');
let adminContent = fs.readFileSync(adminFilePath, 'utf8');

// Remove the duplicate isBlogModalOpen declaration at line 386
adminContent = adminContent.replace(
  `  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
  const [isExpertModalOpen, setIsExpertModalOpen] = useState(false);`,
  `  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [isExpertModalOpen, setIsExpertModalOpen] = useState(false);`
);

// Fix res.data type check in handleFeaturedImageChange
adminContent = adminContent.replace(
  `const res = await uploadService.uploadImage(file, 'blogs/featured');
      if (res?.data?.url) {`,
  `const res: any = await uploadService.uploadImage(file, 'blogs/featured');
      if (res?.data?.url) {`
);

// Fix targetStatus type in handleSaveBlogCMS
adminContent = adminContent.replace(
  `const targetStatus = publishStatus || blogForm.status;`,
  `const targetStatus = (publishStatus || blogForm.status) as 'PUBLISHED' | 'DRAFT';`
);

fs.writeFileSync(adminFilePath, adminContent, 'utf8');
console.log('Fixed AdminPage.tsx duplicate modal state');
