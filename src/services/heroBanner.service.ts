import { HeroPage } from '@prisma/client';
import { CreateHeroBannerInput, UpdateHeroBannerInput } from '@formerbench/shared';
import { heroBannerRepository } from '../repositories/heroBanner.repository';
import { AppError } from '../utils/response';

const normalize = <T extends CreateHeroBannerInput | UpdateHeroBannerInput>(input: T) => ({
  ...input,
  startsAt: input.startsAt ? new Date(input.startsAt) : input.startsAt,
  endsAt: input.endsAt ? new Date(input.endsAt) : input.endsAt,
});

export class HeroBannerService {
  getPublic(page?: HeroPage) { return heroBannerRepository.findAll(page, true); }
  getAdmin(page?: HeroPage) { return heroBannerRepository.findAll(page, false); }
  async get(id: string) {
    const banner = await heroBannerRepository.findById(id);
    if (!banner) throw new AppError('Hero banner not found', 404);
    return banner;
  }
  create(input: CreateHeroBannerInput) { return heroBannerRepository.create(normalize(input) as any); }
  async update(id: string, input: UpdateHeroBannerInput) {
    await this.get(id);
    return heroBannerRepository.update(id, normalize(input) as any);
  }
  async remove(id: string) { await this.get(id); return heroBannerRepository.delete(id); }
  reorder(ids: string[]) { return heroBannerRepository.reorder(ids); }
}
export const heroBannerService = new HeroBannerService();
