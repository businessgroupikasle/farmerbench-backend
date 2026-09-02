import fs from 'fs';
import path from 'path';

console.log('Applying direct fixes to farmer_frontend source files...');

const FALLBACK_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='80' viewBox='0 0 120 80'%3E%3Crect width='100%25' height='100%25' fill='%23E2E8F0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='24'%3E🌾%3C/text%3E%3C/svg%3E";
const VALID_IMG_1 = "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&auto=format&fit=crop&q=80";
const VALID_IMG_2 = "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&auto=format&fit=crop&q=80";
const VALID_IMG_3 = "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=800&auto=format&fit=crop&q=80";
const VALID_IMG_4 = "https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=800&auto=format&fit=crop&q=80";
const VALID_IMG_5 = "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80";

// =========================================================================
// 1. FIX useBlogs.ts
// =========================================================================
const useBlogsPath = path.resolve('../farmer_frontend/src/hooks/useBlogs.ts');
let useBlogsContent = fs.readFileSync(useBlogsPath, 'utf8');

useBlogsContent = `import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blogService } from '../services/blog.service';
import { BlogQueryParams, CreateBlogInput, UpdateBlogInput, BlogStatus } from '../types/blog';
import { useUIStore } from '../store/uiStore';

export const useBlogs = (params?: BlogQueryParams) => {
  const statusKey = params?.status || 'DEFAULT';
  const categoryKey = params?.category || 'ALL';
  const searchKey = params?.search || '';
  const tagKey = params?.tag || '';
  const pageKey = params?.page || 1;
  const sortKey = params?.sortBy || 'newest';

  return useQuery({
    queryKey: ['blogs', statusKey, categoryKey, searchKey, tagKey, pageKey, sortKey],
    queryFn: async () => {
      const res = await blogService.getBlogs(params);
      return res.data || { blogs: [], total: 0, page: 1, totalPages: 1 };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    retry: false,
  });
};

export const useBlog = (idOrSlug: string | undefined) => {
  return useQuery({
    queryKey: ['blog', idOrSlug],
    queryFn: async () => {
      if (!idOrSlug) return null;
      const res = await blogService.getBlog(idOrSlug);
      return res.data || null;
    },
    enabled: Boolean(idOrSlug),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: false,
  });
};

export const useRelatedBlogs = (idOrSlug: string | undefined, category?: string, limit = 3) => {
  return useQuery({
    queryKey: ['blogs', 'related', idOrSlug, category, limit],
    queryFn: async () => {
      if (!idOrSlug) return [];
      const res = await blogService.getRelatedBlogs(idOrSlug, category, limit);
      return res.data || [];
    },
    enabled: Boolean(idOrSlug),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: false,
  });
};

export const useBlogCategories = () => {
  return useQuery({
    queryKey: ['blogs', 'categories'],
    queryFn: async () => {
      const res = await blogService.getCategories();
      return res.data || [];
    },
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    retry: false,
  });
};

export const useBlogMutations = () => {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['blogs'] });
    queryClient.invalidateQueries({ queryKey: ['blog'] });
  };

  const createBlog = useMutation({
    mutationFn: (data: CreateBlogInput) => blogService.createBlog(data),
    onSuccess: (res) => {
      invalidateAll();
      addToast({
        type: 'success',
        message: \`Blog post "\${res.data?.title || 'Article'}" created successfully!\`,
      });
    },
    onError: (error: Error) => {
      addToast({ type: 'error', message: error.message || 'Failed to create blog post' });
    },
  });

  const updateBlog = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBlogInput }) =>
      blogService.updateBlog(id, data),
    onSuccess: (res) => {
      invalidateAll();
      addToast({
        type: 'success',
        message: \`Blog post "\${res.data?.title || 'Article'}" updated successfully!\`,
      });
    },
    onError: (error: Error) => {
      addToast({ type: 'error', message: error.message || 'Failed to update blog post' });
    },
  });

  const deleteBlog = useMutation({
    mutationFn: (id: string) => blogService.deleteBlog(id),
    onSuccess: () => {
      invalidateAll();
      addToast({ type: 'info', message: 'Blog article removed.' });
    },
    onError: (error: Error) => {
      addToast({ type: 'error', message: error.message || 'Failed to delete blog post' });
    },
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BlogStatus }) =>
      blogService.toggleBlogStatus(id, status),
    onSuccess: (res) => {
      invalidateAll();
      const isPub = res.data?.status === 'PUBLISHED';
      addToast({
        type: 'success',
        message: \`Article is now \${isPub ? 'Published live' : 'Saved as Draft'}.\`,
      });
    },
    onError: (error: Error) => {
      addToast({ type: 'error', message: error.message || 'Failed to update status' });
    },
  });

  return {
    createBlog: createBlog.mutateAsync,
    isCreating: createBlog.isPending,
    updateBlog: updateBlog.mutateAsync,
    isUpdating: updateBlog.isPending,
    deleteBlog: deleteBlog.mutateAsync,
    isDeleting: deleteBlog.isPending,
    toggleStatus: toggleStatus.mutateAsync,
    isToggling: toggleStatus.isPending,
  };
};
`;

fs.writeFileSync(useBlogsPath, useBlogsContent, 'utf8');
console.log('✅ Fixed farmer_frontend/src/hooks/useBlogs.ts');


// =========================================================================
// 2. FIX blog.service.ts
// =========================================================================
const blogServicePath = path.resolve('../farmer_frontend/src/services/blog.service.ts');
let blogServiceContent = fs.readFileSync(blogServicePath, 'utf8');

// Replace all broken photo-1592417817098-8f3d6910985c URLs with valid ones
blogServiceContent = blogServiceContent.replaceAll('https://images.unsplash.com/photo-1592417817098-8f3d6910985c?w=1200&auto=format&fit=crop&q=80', VALID_IMG_1);
blogServiceContent = blogServiceContent.replaceAll('https://images.unsplash.com/photo-1592417817098-8f3d6910985c?w=1200', VALID_IMG_1);
blogServiceContent = blogServiceContent.replaceAll('https://images.unsplash.com/photo-1592417817098-8f3d6910985c?w=120', VALID_IMG_1);
blogServiceContent = blogServiceContent.replaceAll('https://images.unsplash.com/photo-1592417817098-8f3d6910985c', VALID_IMG_1);

// Update storage key to v3 so corrupted/broken cached image URLs in localStorage are refreshed with clean valid images
blogServiceContent = blogServiceContent.replace("const STORAGE_KEY = 'farmerbench_blogs_v2';", "const STORAGE_KEY = 'farmerbench_blogs_v3';");
blogServiceContent = blogServiceContent.replace("const STORAGE_KEY = 'farmerbench_blogs_data';", "const STORAGE_KEY = 'farmerbench_blogs_v3';");

fs.writeFileSync(blogServicePath, blogServiceContent, 'utf8');
console.log('✅ Fixed farmer_frontend/src/services/blog.service.ts');


// =========================================================================
// 3. FIX AdminPage.tsx
// =========================================================================
const adminPagePath = path.resolve('../farmer_frontend/src/pages/AdminPage.tsx');
let adminContent = fs.readFileSync(adminPagePath, 'utf8');

// Replace broken image onError loop in Blog Table
adminContent = adminContent.replace(
  `                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src =
                                      'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?w=120';
                                  }}`,
  `                                  onError={(e) => {
                                    const img = e.currentTarget as HTMLImageElement;
                                    img.onerror = null;
                                    img.src = "${VALID_IMG_1}";
                                  }}`
);

// Replace any other occurrences of photo-1592417817098-8f3d6910985c in AdminPage.tsx
adminContent = adminContent.replaceAll('https://images.unsplash.com/photo-1592417817098-8f3d6910985c?w=120', VALID_IMG_1);
adminContent = adminContent.replaceAll('https://images.unsplash.com/photo-1592417817098-8f3d6910985c', VALID_IMG_1);

// Stable query constant for useBlogs
if (!adminContent.includes('const ADMIN_BLOGS_PARAM')) {
  adminContent = adminContent.replace(
    "const { data: adminBlogsData } = useBlogs({ status: 'ALL' });",
    "const ADMIN_BLOGS_PARAM = { status: 'ALL' as const };\n  const { data: adminBlogsData } = useBlogs(ADMIN_BLOGS_PARAM);"
  );
}

fs.writeFileSync(adminPagePath, adminContent, 'utf8');
console.log('✅ Fixed farmer_frontend/src/pages/AdminPage.tsx');


// =========================================================================
// 4. FIX BlogDetailPage.tsx & BlogList.tsx
// =========================================================================
const blogDetailPagePath = path.resolve('../farmer_frontend/src/pages/BlogDetailPage.tsx');
if (fs.existsSync(blogDetailPagePath)) {
  let detailContent = fs.readFileSync(blogDetailPagePath, 'utf8');
  detailContent = detailContent.replaceAll('https://images.unsplash.com/photo-1592417817098-8f3d6910985c', VALID_IMG_1);
  detailContent = detailContent.replace(/onError=\{\(e\)\s*=>\s*\{/g, (match) => {
    return `onError={(e) => {\n                  const target = e.currentTarget as HTMLImageElement;\n                  target.onerror = null;\n`;
  });
  fs.writeFileSync(blogDetailPagePath, detailContent, 'utf8');
  console.log('✅ Fixed farmer_frontend/src/pages/BlogDetailPage.tsx');
}

const blogListPath = path.resolve('../farmer_frontend/src/components/blog/BlogList.tsx');
if (fs.existsSync(blogListPath)) {
  let listContent = fs.readFileSync(blogListPath, 'utf8');
  listContent = listContent.replaceAll('https://images.unsplash.com/photo-1592417817098-8f3d6910985c', VALID_IMG_1);
  listContent = listContent.replace(/onError=\{\(e\)\s*=>\s*\{/g, (match) => {
    return `onError={(e) => {\n                  const target = e.currentTarget as HTMLImageElement;\n                  target.onerror = null;\n`;
  });
  fs.writeFileSync(blogListPath, listContent, 'utf8');
  console.log('✅ Fixed farmer_frontend/src/components/blog/BlogList.tsx');
}

console.log('\n🎉 ALL PAGE-LEVEL FIXES APPLIED SUCCESSFULLY!');
