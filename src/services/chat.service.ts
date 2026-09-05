import { prisma } from '../config/database';
import { aiService, GroundedProduct } from './aiService';
import { Prisma } from '@prisma/client';

export interface ChatRequestInput {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface ChatResponseOutput {
  reply: string;
  products: any[];
  providerUsed?: string;
}

export class ChatService {
  /**
   * Main conversation orchestrator
   */
  async handleChat(input: ChatRequestInput): Promise<ChatResponseOutput> {
    const rawMessage = input.message.trim();
    const history = input.history || [];

    // 1. Detect Intent, Keywords, and Price Constraints
    const { keywords, maxPrice, isProductQuery } = this.analyzeQuery(rawMessage, history);

    // 2. Fetch Verified Products from PostgreSQL Source of Truth
    let matchedProducts: any[] = [];
    if (isProductQuery || keywords.length > 0) {
      matchedProducts = await this.searchProductsInDb(keywords, maxPrice);
    }

    // 3. Format Grounded Products for AI Prompt
    const groundedProducts: GroundedProduct[] = matchedProducts.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      price: p.price,
      discountPrice: p.discountPrice,
      stock: p.stock,
      rating: p.rating,
      numReviews: p.numReviews || p.reviews?.length || 0,
      category: p.category ? { name: p.category.name } : null,
      subcategory: p.subcategory ? { name: p.subcategory.name } : null,
      description: p.description,
    }));

    // 4. Generate Grounded AI Response
    const aiResult = await aiService.generateResponse(rawMessage, history, groundedProducts);

    // Clean up products for frontend output (remove verbose internal description)
    const clientProducts = matchedProducts.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      price: p.price,
      discountPrice: p.discountPrice,
      stock: p.stock,
      rating: p.rating,
      numReviews: p.numReviews || p.reviews?.length || 0,
      featured: p.featured,
      images: p.images,
      category: p.category ? { id: p.category.id, name: p.category.name, slug: p.category.slug } : null,
      subcategory: p.subcategory ? { id: p.subcategory.id, name: p.subcategory.name, slug: p.subcategory.slug } : null,
    }));

    return {
      reply: aiResult.reply,
      products: clientProducts,
      providerUsed: aiResult.providerUsed,
    };
  }

  /**
   * Natural Language & Tanglish Query Analyzer
   */
  private analyzeQuery(
    currentMessage: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>
  ) {
    const text = currentMessage.toLowerCase();

    // Include context from the last user query if current message is very short (e.g. "500 kulla iruka?", "price?")
    const previousUserMsg = [...history].reverse().find((h) => h.role === 'user')?.content.toLowerCase() || '';
    const combinedContext = `${previousUserMsg} ${text}`;

    // 1. Price constraint extraction (e.g., "500 kulla", "under 600", "below Rs 400", "500 rupees kulla")
    let maxPrice: number | undefined;
    const pricePatterns = [
      /(?:under|below|less than|within|upto|up to|kulla)\s*(?:rs\.?|inr|₹)?\s*(\d+)/i,
      /(\d+)\s*(?:rs\.?|inr|₹|rupees|rubai)?\s*(?:kulla|below|under)/i,
      /(?:rs\.?|inr|₹)\s*(\d+)/i,
    ];

    for (const pattern of pricePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const parsed = parseInt(match[1], 10);
        if (!isNaN(parsed) && parsed > 0 && parsed < 100000) {
          maxPrice = parsed;
          break;
        }
      }
    }

    // 2. Multilingual Keyword Mapping (English, Tamil transliteration / Tanglish)
    const keywords: string[] = [];

    const synonymMap: Record<string, string[]> = {
      fertilizer: ['fertilizer', 'uram', 'nourish', 'micronutrient', 'conditioner', 'humic', 'stimulant'],
      stimulant: ['growth', 'booster', 'stimulant', 'seaweed', 'valarchi'],
      pesticide: ['pesticide', 'poochi', 'marundhu', 'insect', 'pest', 'worm'],
      fungicide: ['fungicide', 'fungus', 'rotting', 'rot', 'mildew', 'trichoderma', 'azukal'],
      neem: ['neem', 'veppam', 'veppennai', 'azadirachtin'],
      humic: ['humic', 'soil', 'conditioner', 'potassium'],
      seaweed: ['seaweed', 'paasi', 'extract', 'marine'],
      seed: ['seed', 'seeds', 'vidhai', 'vithai', 'bpt', 'paddy seed'],
      paddy: ['paddy', 'nellu', 'arisi', 'rice'],
      tomato: ['tomato', 'thakkali'],
      cotton: ['cotton', 'paruthi'],
      spray: ['sprayer', 'battery sprayer', 'pump'],
    };

    for (const [key, aliases] of Object.entries(synonymMap)) {
      const matchesInCurrent = aliases.some((alias) => text.includes(alias));
      const matchesInContext = aliases.some((alias) => combinedContext.includes(alias));

      if (matchesInCurrent || (text.length < 25 && matchesInContext)) {
        keywords.push(key);
      }
    }

    // Add direct English alpha-numeric tokens from user message (length >= 3)
    const rawTokens = text
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 3 && !['the', 'and', 'for', 'are', 'what', 'which', 'how', 'show', 'give', 'venum', 'iruka', 'kaatu', 'enna', 'oru', 'with'].includes(t));

    for (const token of rawTokens) {
      if (!keywords.includes(token)) {
        keywords.push(token);
      }
    }

    // Determine if query is asking for products
    const productIntentTriggers = [
      'product', 'buy', 'price', 'fertilizer', 'uram', 'marundhu', 'seed', 'vidhai',
      'cost', 'recommend', 'suggest', 'available', 'iruka', 'venum', 'kaatu', 'rate',
      'spray', 'booster', 'neem', 'humic', 'paddy', 'tomato', 'cotton'
    ];
    const isProductQuery = productIntentTriggers.some((trigger) => combinedContext.includes(trigger));

    return {
      keywords,
      maxPrice,
      isProductQuery,
    };
  }

  /**
   * Queries PostgreSQL using Prisma for verified catalog products
   */
  private async searchProductsInDb(keywords: string[], maxPrice?: number) {
    try {
      const orConditions: Prisma.ProductWhereInput[] = [];

      for (const kw of keywords.slice(0, 5)) {
        orConditions.push(
          { title: { contains: kw, mode: 'insensitive' } },
          { description: { contains: kw, mode: 'insensitive' } },
          { category: { name: { contains: kw, mode: 'insensitive' } } },
          { subcategory: { name: { contains: kw, mode: 'insensitive' } } }
        );
      }

      const where: Prisma.ProductWhereInput = {};

      if (orConditions.length > 0) {
        where.OR = orConditions;
      }

      if (maxPrice !== undefined) {
        where.AND = [
          {
            OR: [
              { price: { lte: maxPrice } },
              { discountPrice: { lte: maxPrice } },
            ],
          },
        ];
      }

      let products = await prisma.product.findMany({
        where,
        include: {
          category: true,
          subcategory: true,
          reviews: { select: { rating: true } },
        },
        orderBy: [
          { featured: 'desc' },
          { rating: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 6,
      });

      // If strict filter yielded nothing but maxPrice was provided, try returning products within budget
      if (products.length === 0 && maxPrice !== undefined) {
        products = await prisma.product.findMany({
          where: {
            OR: [
              { price: { lte: maxPrice } },
              { discountPrice: { lte: maxPrice } },
            ],
          },
          include: {
            category: true,
            subcategory: true,
            reviews: { select: { rating: true } },
          },
          orderBy: { price: 'asc' },
          take: 4,
        });
      }

      return products.map((product) => ({
        ...product,
        numReviews: product.reviews.length,
        rating: product.reviews.length
          ? Number((product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length).toFixed(1))
          : product.rating || 0,
      }));
    } catch (error: any) {
      console.error('[ChatService] PostgreSQL query error:', error?.message || error);
      return [];
    }
  }
}

export const chatService = new ChatService();
