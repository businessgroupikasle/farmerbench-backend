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

const cleanVal = (val?: string): string => {
  if (!val) return '';
  const trimmed = val.trim();
  return trimmed.toUpperCase() === 'NA' ? '' : trimmed;
};

const formatTitleCase = (val: string): string => {
  if (!val) return '';
  return val
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

class PostalCodeService {
  async lookup(postalCode: string): Promise<PostalLocation> {
    if (!/^\d{6}$/.test(postalCode)) {
      throw new AppError('Enter a valid 6-digit Indian pincode', 400);
    }

    const store = (prisma as any).postalCodeLookup;
    if (store) {
      const saved = await store.findUnique({ where: { postalCode } }).catch(() => null);
      if (saved && Date.now() - new Date(saved.lastVerifiedAt).getTime() < 30 * 86400000) {
        if (saved.district && saved.district.toUpperCase() !== 'NA') {
          return { ...saved, postOffices: saved.postOffice ? saved.postOffice.split('|') : [] };
        }
      }
    }

    // 1. Try Primary: Government of India Data Portal (data.gov.in)
    let records: any[] = [];
    let raw: any = null;

    if (env.POSTAL_CODE_API_KEY) {
      try {
        const url = new URL(`https://api.data.gov.in/resource/${env.POSTAL_CODE_API_RESOURCE_ID}`);
        url.searchParams.set('api-key', env.POSTAL_CODE_API_KEY);
        url.searchParams.set('format', 'json');
        url.searchParams.set('limit', '50');
        url.searchParams.set('filters[pincode]', postalCode);

        const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (response.ok) {
          raw = await response.json();
          if (Array.isArray(raw?.records) && raw.records.length > 0) {
            records = raw.records;
          }
        }
      } catch {
        // Fallback below
      }
    }

    // 2. Fallback: All-India Postal Pincode Directory (api.postalpincode.in)
    if (!records.length) {
      try {
        const fallbackRes = await fetch(`https://api.postalpincode.in/pincode/${postalCode}`, {
          signal: AbortSignal.timeout(8000),
        });
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          if (
            Array.isArray(fallbackData) &&
            fallbackData[0]?.Status === 'Success' &&
            Array.isArray(fallbackData[0].PostOffice) &&
            fallbackData[0].PostOffice.length > 0
          ) {
            const poList = fallbackData[0].PostOffice;
            const names = [...new Set(poList.map((p: any) => p.Name).filter(Boolean))] as string[];
            const firstPo = poList[0];
            const location: PostalLocation = {
              postalCode,
              city: cleanVal(firstPo.Block) || cleanVal(firstPo.Division) || cleanVal(firstPo.District) || '',
              district: cleanVal(firstPo.District) || cleanVal(firstPo.Division) || '',
              state: formatTitleCase(cleanVal(firstPo.State) || ''),
              country: 'India',
              postOffice: names[0] || '',
              postOffices: names,
            };

            if (store) {
              await store.upsert({
                where: { postalCode },
                create: { ...location, postOffices: undefined, postOffice: names.join('|'), providerData: fallbackData },
                update: { ...location, postOffices: undefined, postOffice: names.join('|'), providerData: fallbackData, lastVerifiedAt: new Date() },
              }).catch(() => undefined);
            }

            return location;
          }
        }
      } catch {
        // Continue
      }
    }

    if (!records.length) {
      throw new AppError('Pincode not found in Indian Postal directory', 404);
    }

    const first = records[0];
    const names = [...new Set(records.map((r) => r.officename || r.office_name).filter(Boolean))] as string[];
    const district = cleanVal(first.districtname) || cleanVal(first.district) || cleanVal(first.divisionname) || '';
    const city = cleanVal(first.taluk) || cleanVal(first.divisionname) || district || '';
    const state = formatTitleCase(cleanVal(first.statename) || cleanVal(first.state_name) || '');

    const location: PostalLocation = {
      postalCode,
      city: city || district,
      district: district || city,
      state: state || 'India',
      country: 'India',
      postOffice: names[0] || '',
      postOffices: names,
    };

    if (!location.city && !location.state) {
      throw new AppError('Incomplete location received for this pincode', 502);
    }

    if (store) {
      await store.upsert({
        where: { postalCode },
        create: { ...location, postOffices: undefined, postOffice: names.join('|'), providerData: raw },
        update: { ...location, postOffices: undefined, postOffice: names.join('|'), providerData: raw, lastVerifiedAt: new Date() },
      }).catch(() => undefined);
    }

    return location;
  }
}

export const postalCodeService = new PostalCodeService();
