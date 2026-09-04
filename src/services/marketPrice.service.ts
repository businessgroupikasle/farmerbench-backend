import { env } from '../config/env';
import { AppError } from '../utils/response';

const MARKET_API_URL =
  'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
const MARKET_STATE = 'Tamil Nadu';
const CACHE_TTL_MS = 30 * 60 * 1000;

interface MarketApiRecord {
  state?: string;
  district?: string;
  market?: string;
  commodity?: string;
  variety?: string;
  arrival_date?: string;
  min_price?: string;
  max_price?: string;
  modal_price?: string;
}

interface MarketApiResponse {
  records?: MarketApiRecord[];
}

export interface MarketPrice {
  commodity: string;
  variety: string;
  market: string;
  district: string;
  state: string;
  arrivalDate: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  change: number | null;
  unit: 'quintal';
}

let cache: { expiresAt: number; data: MarketPrice[] } | null = null;

const parsePrice = (value?: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseDate = (value?: string) => {
  if (!value) return 0;
  const [day, month, year] = value.split('/').map(Number);
  return year && month && day ? Date.UTC(year, month - 1, day) : Date.parse(value);
};

export class MarketPriceService {
  async getLatestPrices(limit = 6): Promise<MarketPrice[]> {
    if (cache && cache.expiresAt > Date.now()) {
      return cache.data.slice(0, limit);
    }

    if (!env.MARKET_PRICE_API_KEY) {
      throw new AppError('Market price API is not configured', 503);
    }

    const url = new URL(MARKET_API_URL);
    url.searchParams.set('api-key', env.MARKET_PRICE_API_KEY);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1000');
    url.searchParams.set('filters[state]', MARKET_STATE);

    let response: globalThis.Response;
    try {
      response = await fetch(url, { signal: AbortSignal.timeout(12_000) });
    } catch {
      throw new AppError('Unable to reach the market price service', 502);
    }

    if (!response.ok) {
      throw new AppError('Market price service returned an error', 502);
    }

    const payload = (await response.json()) as MarketApiResponse;
    const records = (payload.records ?? [])
      .filter((record) => record.commodity && parsePrice(record.modal_price) > 0)
      .sort((a, b) => parseDate(b.arrival_date) - parseDate(a.arrival_date));

    const latestByCommodity = new Map<string, MarketApiRecord>();
    const previousByCommodity = new Map<string, MarketApiRecord>();

    for (const record of records) {
      const key = record.commodity!.trim().toLowerCase();
      const latest = latestByCommodity.get(key);
      if (!latest) {
        latestByCommodity.set(key, record);
      } else if (
        !previousByCommodity.has(key) &&
        record.arrival_date !== latest.arrival_date
      ) {
        previousByCommodity.set(key, record);
      }
    }

    const data = Array.from(latestByCommodity.entries()).map(([key, record]) => {
      const modalPrice = parsePrice(record.modal_price);
      const previous = previousByCommodity.get(key);
      const previousPrice = parsePrice(previous?.modal_price);

      return {
        commodity: record.commodity!.trim(),
        variety: record.variety?.trim() || 'Other',
        market: record.market?.trim() || '',
        district: record.district?.trim() || '',
        state: record.state?.trim() || '',
        arrivalDate: record.arrival_date?.trim() || '',
        minPrice: parsePrice(record.min_price),
        maxPrice: parsePrice(record.max_price),
        modalPrice,
        change: previousPrice > 0 ? modalPrice - previousPrice : null,
        unit: 'quintal' as const,
      };
    });

    if (!data.length) {
      throw new AppError('No current market prices are available', 502);
    }

    cache = { expiresAt: Date.now() + CACHE_TTL_MS, data };
    return data.slice(0, limit);
  }
}

export const marketPriceService = new MarketPriceService();
