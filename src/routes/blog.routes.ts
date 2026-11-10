import { Router } from 'express';
import { blogController } from '../controllers/blog.controller';
import { requireAuth, requireAdmin, optionalAuth } from '../middlewares/auth.middleware';
import { validateBody, validateQuery } from '../middlewares/validate.middleware';
import { CreateBlogSchema, UpdateBlogSchema, BlogQuerySchema } from '@formerbench/shared';

const router = Router();

// Public routes (optionalAuth lets admins see drafts; visitors only see published posts)
router.get('/', optionalAuth, validateQuery(BlogQuerySchema), blogController.getBlogs);
router.get('/categories', blogController.getCategories);
router.get('/:idOrSlug', optionalAuth, blogController.getBlog);
router.get('/:idOrSlug/related', blogController.getRelatedBlogs);

// Protected Admin routes
router.post(
  '/',
  requireAuth,
  requireAdmin,
  validateBody(CreateBlogSchema),
  blogController.createBlog
);

router.put(
  '/:id',
  requireAuth,
  requireAdmin,
  validateBody(UpdateBlogSchema),
  blogController.updateBlog
);

router.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  blogController.deleteBlog
);

export default router;
