import { Request, Response, NextFunction } from 'express';
import { subcategoryService } from '../services/subcategory.service';
import { sendSuccess } from '../utils/response';

export class SubcategoryController {
  async getSubcategories(req: Request, res: Response, next: NextFunction) {
    try { return sendSuccess(res, await subcategoryService.getSubcategories(req.query.categoryId as string | undefined)); }
    catch (error) { next(error); }
  }
  async getSubcategory(req: Request, res: Response, next: NextFunction) {
    try { return sendSuccess(res, await subcategoryService.getSubcategory(req.params.slugOrId)); }
    catch (error) { next(error); }
  }
  async createSubcategory(req: Request, res: Response, next: NextFunction) {
    try { return sendSuccess(res, await subcategoryService.createSubcategory(req.body), 'Subcategory created successfully', 201); }
    catch (error) { next(error); }
  }
  async updateSubcategory(req: Request, res: Response, next: NextFunction) {
    try { return sendSuccess(res, await subcategoryService.updateSubcategory(req.params.id, req.body), 'Subcategory updated successfully'); }
    catch (error) { next(error); }
  }
  async deleteSubcategory(req: Request, res: Response, next: NextFunction) {
    try { return sendSuccess(res, await subcategoryService.deleteSubcategory(req.params.id), 'Subcategory deactivated successfully'); }
    catch (error) { next(error); }
  }
}
export const subcategoryController = new SubcategoryController();
