import { Request, Response, NextFunction } from 'express';
import { HeroPage } from '@prisma/client';
import { heroBannerService } from '../services/heroBanner.service';
import { sendSuccess } from '../utils/response';

export class HeroBannerController {
  async listPublic(req: Request, res: Response, next: NextFunction) { try { return sendSuccess(res, await heroBannerService.getPublic(req.query.page as HeroPage)); } catch (e) { next(e); } }
  async listAdmin(req: Request, res: Response, next: NextFunction) { try { return sendSuccess(res, await heroBannerService.getAdmin(req.query.page as HeroPage)); } catch (e) { next(e); } }
  async get(req: Request, res: Response, next: NextFunction) {
    try {
      // Inactive or scheduled (unreleased) banners are only visible to admins.
      const banner = req.user?.role === 'ADMIN'
        ? await heroBannerService.get(req.params.id)
        : await heroBannerService.getPublicById(req.params.id);
      return sendSuccess(res, banner);
    } catch (e) { next(e); }
  }
  async create(req: Request, res: Response, next: NextFunction) { try { return sendSuccess(res, await heroBannerService.create(req.body), 'Hero banner created', 201); } catch (e) { next(e); } }
  async update(req: Request, res: Response, next: NextFunction) { try { return sendSuccess(res, await heroBannerService.update(req.params.id, req.body), 'Hero banner updated'); } catch (e) { next(e); } }
  async remove(req: Request, res: Response, next: NextFunction) { try { return sendSuccess(res, await heroBannerService.remove(req.params.id), 'Hero banner deleted'); } catch (e) { next(e); } }
  async reorder(req: Request, res: Response, next: NextFunction) { try { return sendSuccess(res, await heroBannerService.reorder(req.body.ids), 'Hero banners reordered'); } catch (e) { next(e); } }
}
export const heroBannerController = new HeroBannerController();
