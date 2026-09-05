import { prisma } from '../config/database';
import { env } from '../config/env';
import { AppError } from '../utils/response';

export interface PostalLocation {
  postalCode: string;
  city: string;
  district: string;
  state: string;
  country: string;
  postOffice: string;
  postOffices: string[];
}

class PostalCodeService {
  async lookup(postalCode: string): Promise<PostalLocation> {
    if (!/^\d{6}$/.test(postalCode)) throw new AppError('Enter a valid 6-digit Indian pincode', 400);
    const store = (prisma as any).postalCodeLookup;
    if (store) {
      const saved = await store.findUnique({ where: { postalCode } }).catch(() => null);
      if (saved && Date.now() - new Date(saved.lastVerifiedAt).getTime() < 30 * 86400000) {
        return { ...saved, postOffices: saved.postOffice ? saved.postOffice.split('|') : [] };
      }
    }

    const url = new URL(`https://api.data.gov.in/resource/${env.POSTAL_CODE_API_RESOURCE_ID}`);
    url.searchParams.set('api-key', env.POSTAL_CODE_API_KEY);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '50');
    url.searchParams.set('filters[pincode]', postalCode);
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) }).catch(() => {
      throw new AppError('Postal location service is temporarily unavailable', 503);
    });
    if (!response.ok) throw new AppError('Unable to verify this pincode', 502);
    const raw: any = await response.json();
    const records: any[] = Array.isArray(raw?.records) ? raw.records : [];
    if (!records.length) throw new AppError('Pincode not found', 404);
    const first = records[0];
    const names = [...new Set(records.map((r) => r.officename || r.office_name).filter(Boolean))] as string[];
    const location: PostalLocation = {
      postalCode,
      city: first.taluk || first.divisionname || first.district || '',
      district: first.district || '',
      state: first.statename || first.state_name || '',
      country: 'India',
      postOffice: names[0] || '',
      postOffices: names,
    };
    if (!location.city || !location.state) throw new AppError('Incomplete location received for this pincode', 502);
    if (store) await store.upsert({
      where: { postalCode },
      create: { ...location, postOffices: undefined, postOffice: names.join('|'), providerData: raw },
      update: { ...location, postOffices: undefined, postOffice: names.join('|'), providerData: raw, lastVerifiedAt: new Date() },
    }).catch(() => undefined);
    return location;
  }
}

export const postalCodeService = new PostalCodeService();
