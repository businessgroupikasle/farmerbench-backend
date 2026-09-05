import { env } from '../config/env';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GroundedProduct {
  id: string;
  title: string;
  slug: string;
  price: number;
  discountPrice?: number | null;
  stock: number;
  rating: number;
  numReviews: number;
  category?: { name: string } | null;
  subcategory?: { name: string } | null;
  description?: string;
}

export interface AIServiceResponse {
  reply: string;
  providerUsed: string;
}

export class AIService {
  private provider: string;
  private apiKey: string;
  private model: string;

  constructor() {
    this.provider = (env.AI_PROVIDER || 'gemini').toLowerCase();
    this.apiKey = env.AI_API_KEY || '';
    this.model = env.AI_MODEL || (this.provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini');
  }

  /**
   * Builds the comprehensive AgriEra AI system prompt
   */
  private buildSystemPrompt(products: GroundedProduct[]): string {
    const productsContext = products.length > 0
      ? products
          .map((p, idx) => {
            const currentPrice = p.discountPrice && p.discountPrice < p.price ? p.discountPrice : p.price;
            const originalPrice = p.discountPrice && p.discountPrice < p.price ? ` (Original MRP: ₹${p.price})` : '';
            return `[${idx + 1}] "${p.title}"
- Category: ${p.category?.name || 'General'}${p.subcategory?.name ? ' > ' + p.subcategory.name : ''}
- Price: ₹${currentPrice}${originalPrice}
- Stock Availability: ${p.stock > 0 ? `In Stock (${p.stock} units available)` : 'Out of Stock'}
- Rating: ${p.rating > 0 ? `${p.rating}/5 (${p.numReviews} reviews)` : 'Not yet reviewed'}
- Key Info: ${(p.description || '').slice(0, 200).replace(/\s+/g, ' ')}`;
          })
          .join('\n\n')
      : 'No matching products currently found in the AgriEra catalog for this query.';

    return `You are "AgriEra AI" (விவசாயி AI உதவியாளர்), an intelligent, courteous agricultural advisor and product assistant for the AgriEra e-commerce store.

OBJECTIVES:
1. Product Guidance:
   - Provide accurate information regarding organic fertilizers, bio-stimulants, bio-pesticides, seeds, seedlings, and farm tools.
   - ALWAYS reference actual products listed in the "VERIFIED DATABASE PRODUCTS" section below.
   - Mention the exact prices in Rupees (₹) as listed in the database.
   - NEVER invent or hallucinate product names, prices, discounts, or stock details.
   - If a requested product is not in the database, clearly state: "AgriEra-ல் இந்த பொருள் தற்போது இருப்பில் இல்லை (This product is currently not available in our catalog)."

2. Multilingual Fluency:
   - Understand questions seamlessly in English, Tamil (தமிழ்), and Tanglish (Tamil words written in English letters).
   - Examples of Tanglish queries to handle naturally:
     * "Tomato-ku fertilizer iruka?" -> Reply in helpful Tanglish or Tamil: "Aamanga, thakkali payirukku AgriEra-la nalla bio-fertilizers iruku..."
     * "500 kulla fertilizer kaatu" -> Highlight products priced <= ₹500 from the verified list below.
     * "Cotton-ku enna product?" -> Suggest bio-pesticides/boosters suited for cotton from the verified list.
     * "Order epdi place panradhu?" -> Explain how to add items to the cart and proceed to checkout.
   - Mirror the user's preferred language (Tanglish -> Tanglish/English; Tamil script -> Tamil; English -> English).

3. Agricultural Advisory:
   - Give sound, eco-friendly farming advice for soil health, pest management, crop stages, and irrigation.
   - For severe, uncertain plant diseases or extensive pest damage, encourage the farmer to consult a local Agricultural Extension Officer or qualified agronomist for a definitive field inspection.
   - Do NOT give unverified chemical prescriptions.

4. AgriEra Website FAQs:
   - Orders: Browse products -> click "Add to Bag" -> Go to Cart / Checkout.
   - Delivery: Pan-India delivery via postal code coverage. Tracking available in dashboard.
   - Support: For damaged goods or queries, contact support@AgriEra.in or call support within 48 hours.
   - Farm Services: We offer Farm Development, Well Development, Drip Irrigation, and Farm Consultancy.

VERIFIED DATABASE PRODUCTS (Source of Truth):
${productsContext}

RESPONSE STYLE:
- Warm, polite, respectful, and farmer-centric.
- Keep responses concise, well-structured, and easy to read on mobile screens (use bullet points where appropriate).
- Always be encouraging and supportive of our farmers (உழவே தலை).`;
  }

  /**
   * Main entry point to generate a reply
   */
  async generateResponse(
    userMessage: string,
    conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [],
    products: GroundedProduct[] = []
  ): Promise<AIServiceResponse> {
    const systemPrompt = this.buildSystemPrompt(products);

    // If no API key configured or provider is 'mock', use the intelligent local agricultural fallback
    if (!this.apiKey || this.provider === 'mock') {
      return {
        reply: this.generateFallbackResponse(userMessage, conversationHistory, products),
        providerUsed: 'fallback-rules',
      };
    }

    try {
      if (this.provider === 'gemini') {
        const reply = await this.callGemini(systemPrompt, conversationHistory, userMessage);
        return { reply, providerUsed: `gemini (${this.model})` };
      }

      if (this.provider === 'openai' || this.provider === 'groq') {
        const reply = await this.callOpenAICompatible(systemPrompt, conversationHistory, userMessage);
        return { reply, providerUsed: `${this.provider} (${this.model})` };
      }

      // Default fallback if unknown provider
      return {
        reply: this.generateFallbackResponse(userMessage, conversationHistory, products),
        providerUsed: 'fallback-rules',
      };
    } catch (error: any) {
      console.error(`[AIService] Error with provider ${this.provider}:`, error?.message || error);
      // Graceful degradation: return smart fallback reply so user experience never fails
      return {
        reply: this.generateFallbackResponse(userMessage, conversationHistory, products),
        providerUsed: 'fallback-on-error',
      };
    }
  }

    /**
   * Google Gemini REST API Integration
   */
  private async callGemini(
    systemPrompt: string,
    history: { role: 'user' | 'assistant'; content: string }[],
    userMessage: string,
    retryModel?: string
  ): Promise<string> {
    const currentKey = process.env.AI_API_KEY || env.AI_API_KEY || this.apiKey;
    const currentModel = retryModel || process.env.AI_MODEL || env.AI_MODEL || this.model || 'gemini-3.6-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      currentModel
    )}:generateContent?key=${encodeURIComponent(currentKey)}`;

    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    const recentHistory = history.slice(-6);
    for (const msg of recentHistory) {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: userMessage }],
    });

    const payload = {
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents,
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 800,
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      if ((response.status === 404 || errText.includes('NOT_FOUND')) && !retryModel && currentModel !== 'gemini-3.6-flash') {
        console.log(`[AIService] Model ${currentModel} not available, retrying with gemini-3.6-flash...`);
        return this.callGemini(systemPrompt, history, userMessage, 'gemini-3.6-flash');
      }
      throw new Error(`Gemini API HTTP ${response.status}: ${errText.slice(0, 300)}`);
    }

    const data: any = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('Gemini returned an empty response.');
    }

    return candidateText.trim();
  }

  /**
   * OpenAI / Groq / OpenRouter Compatible REST API
   */
  private async callOpenAICompatible(
    systemPrompt: string,
    history: { role: 'user' | 'assistant'; content: string }[],
    userMessage: string
  ): Promise<string> {
    const isGroq = this.provider === 'groq';
    const endpoint = isGroq
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage },
    ];

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model || (isGroq ? 'llama-3.1-8b-instant' : 'gpt-4o-mini'),
        messages,
        temperature: 0.5,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`${this.provider.toUpperCase()} API HTTP ${response.status}: ${errText.slice(0, 300)}`);
    }

    const data: any = await response.json();
    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) {
      throw new Error('${this.provider} returned an empty message.');
    }

    return reply.trim();
  }

  /**
   * Intelligent offline fallback response generator.
   * Produces grounded, helpful responses in English/Tanglish using the retrieved database products and FAQ rules.
   */
  private generateFallbackResponse(
    userMessage: string,
    _history: { role: 'user' | 'assistant'; content: string }[],
    products: GroundedProduct[]
  ): string {
    const query = userMessage.toLowerCase();

    // Order or Website Help
    if (query.includes('order') || query.includes('epdi') || query.includes('how to buy') || query.includes('place')) {
      return `வணக்கம்! AgriEra-ல் ஆர்டர் செய்வது மிக எளிது:

1. **பொருளைத் தேர்ந்தெடுங்கள்**: நீங்கள் விரும்பும் பொருளின் கீழ் உள்ள **"Add to Cart"** அல்லது **"Buy Now"** பட்டனை கிளிக் செய்யவும்.
2. **Shopping Bag**: வலதுபுறம் தோன்றும் Cart டிராயரில் அளவை சரிபார்க்கவும்.
3. **Checkout**: முகவரி மற்றும் கட்டண முறையை (COD / Online Payment) தேர்வு செய்து ஆர்டரை உறுதி செய்யவும்!

ஏதேனும் சந்தேகம் இருந்தால் உடனடியாக கேளுங்கள்!`;
    }

    // Services or Consultancy
    if (query.includes('service') || query.includes('consult') || query.includes('borewell') || query.includes('well') || query.includes('drip')) {
      return `AgriEra விவசாயிகளுக்காக பல்வேறு சிறப்பு சேவைகளை வழங்குகிறது:
- 🌿 **Farm Development**: நிலம் மேம்பாடு மற்றும் மேலாண்மை.
- 💧 **Drip Irrigation**: சொட்டு நீர் பாசன அமைப்பு திட்டம் மற்றும் அமைத்தல்.
- 🚜 **Well & Borewell Planning**: நீர் ஆதார மேம்பாடு.
- 👨‍🌾 **Farm Consultancy**: வேளாண் வல்லுநர்களின் நேரடி ஆலோசனை.

எங்கள் **Services** பக்கத்திற்குச் சென்று உங்கள் தேவையைப் பதிவு செய்யலாம் அல்லது support@AgriEra.in வழியாக எங்களைத் தொடர்பு கொள்ளலாம்!`;
    }

    // If products were found in PostgreSQL
    if (products.length > 0) {
      const productLines = products
        .slice(0, 3)
        .map((p) => {
          const price = p.discountPrice && p.discountPrice < p.price ? p.discountPrice : p.price;
          return `• **${p.title}** - ₹${price} (${p.stock > 0 ? 'In Stock' : 'Out of Stock'})`;
        })
        .join('\n');

      const isTanglish =
        query.includes('venum') ||
        query.includes('iruka') ||
        query.includes('kaatu') ||
        query.includes('ku') ||
        query.includes('enna');

      if (isTanglish) {
        return `வணக்கம்! உங்கள் தேவைக்கான சிறந்த AgriEra தயாரிப்புகள் கீழே உள்ள பட்டியலில் உள்ளன:

${productLines}

கீழே உள்ள Product Card-ல் **"Add to Bag"** கொடுத்து நேரடியாக ஆர்டர் செய்யலாம். பயிர் பராமரிப்பு குறித்த கூடுதல் கேள்விகளையும் நீங்கள் கேட்கலாம்!`;
      }

      return `Here are the recommended genuine products from our AgriEra catalog:

${productLines}

You can view full details or click **"Add to Bag"** on the product cards below to order directly. Let me know if you need dosage instructions or application guidelines!`;
    }

    // Default polite guidance if no specific products matched
    return `வணக்கம்! நான் AgriEra AI உதவியாளர். 
நீங்கள் கேட்ட பொருள் தற்போது எங்கள் நேரடி பட்டியலில் இல்லை அல்லது வேறு பெயரில் இருக்கலாம்.

உங்களுக்கு உதவ சில பரிந்துரைகள்:
1. உரங்கள் மற்றும் வளர்ச்சி ஊக்கிகளுக்கு **Bio Stimulants** & **Bio Fertilizers** பிரிவைப் பார்வையிடுங்கள்.
2. பூச்சி மற்றும் பூஞ்சை தாக்குதலுக்கு **Bio Pesticides** மற்றும் **Bio Fungicides** பயனுள்ளதாக இருக்கும்.
3. தீவிர பயிர் நோய்களுக்கு அருகில் உள்ள வேளாண்மை அலுவலர் அல்லது தகுதியான வேளாண் வல்லுநரை அணுகி ஆலோசனை பெறுவது நலம்.

உங்களுக்கு எந்த பயிருக்கு (எ.கா: தக்காளி, நெல், பருத்தி) ஆலோசனை வேண்டும் என்று கூறினால் உதவ தயாராக உள்ளேன்!`;
  }
}

export const aiService = new AIService();
