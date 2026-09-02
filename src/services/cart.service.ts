import { cartRepository } from '../repositories/cart.repository';
import { productRepository } from '../repositories/product.repository';
import { AddToCartInput, SyncCartInput } from '@formerbench/shared';
import { AppError } from '../utils/response';

export class CartService {
  private formatCart(cart: any) {
    if (!cart) {
      return {
        id: '',
        userId: null,
        items: [],
        subtotal: 0,
        totalItems: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    const items = cart.items || [];
    let subtotal = 0;
    let totalItems = 0;

    for (const item of items) {
      const selectedAttrs = (item.selectedAttributes as Record<string, any>) || {};
      const packSize = selectedAttrs.packSize;
      const attrs = (item.product?.attributes as Record<string, any>) || {};
      const variants: Array<{ packSize: string; price: number; comparePrice?: number; stock?: number }> =
        Array.isArray(attrs.variants) ? attrs.variants : [];
      const matchedVariant = packSize ? variants.find((v) => v.packSize === packSize) : null;

      const price = matchedVariant
        ? Number(matchedVariant.price)
        : (item.product?.discountPrice ?? item.product?.price ?? 0);

      subtotal += price * item.quantity;
      totalItems += item.quantity;
    }

    return {
      id: cart.id,
      userId: cart.userId,
      items,
      subtotal: Number(subtotal.toFixed(2)),
      totalItems,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }

  async getCart(userId: string) {
    const cart = await cartRepository.getOrCreateCart(userId);
    return this.formatCart(cart);
  }

  async addToCart(userId: string, input: AddToCartInput) {
    const product = await productRepository.findById(input.productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const selectedAttrs = (input.selectedAttributes as Record<string, any>) || {};
    const packSize = selectedAttrs.packSize;
    const attrs = (product.attributes as Record<string, any>) || {};
    const variants: Array<{ packSize: string; price: number; comparePrice?: number; stock?: number }> =
      Array.isArray(attrs.variants) ? attrs.variants : [];
    const matchedVariant = packSize ? variants.find((v) => v.packSize === packSize) : null;
    const availableStock =
      matchedVariant && typeof matchedVariant.stock === 'number'
        ? matchedVariant.stock
        : product.stock;

    if (availableStock < input.quantity) {
      throw new AppError(
        `Only ${availableStock} items in stock for "${product.title}${packSize ? ` (${packSize})` : ''}"`,
        400
      );
    }

    const cart = await cartRepository.addItem(
      userId,
      input.productId,
      input.quantity,
      input.selectedAttributes
    );

    return this.formatCart(cart);
  }

  async updateCartItem(userId: string, cartItemId: string, quantity: number) {
    const cart = await cartRepository.findByUserId(userId);
    if (!cart) {
      throw new AppError('Cart not found', 404);
    }

    const item = cart.items.find((i) => i.id === cartItemId);
    if (!item) {
      throw new AppError('Cart item not found', 404);
    }

    const selectedAttrs = (item.selectedAttributes as Record<string, any>) || {};
    const packSize = selectedAttrs.packSize;
    const attrs = (item.product.attributes as Record<string, any>) || {};
    const variants: Array<{ packSize: string; price: number; comparePrice?: number; stock?: number }> =
      Array.isArray(attrs.variants) ? attrs.variants : [];
    const matchedVariant = packSize ? variants.find((v) => v.packSize === packSize) : null;
    const availableStock =
      matchedVariant && typeof matchedVariant.stock === 'number'
        ? matchedVariant.stock
        : item.product.stock;

    if (quantity > 0 && availableStock < quantity) {
      throw new AppError(`Only ${availableStock} items in stock`, 400);
    }

    const updated = await cartRepository.updateItem(userId, cartItemId, quantity);
    return this.formatCart(updated);
  }

  async removeCartItem(userId: string, cartItemId: string) {
    const updated = await cartRepository.removeItem(userId, cartItemId);
    return this.formatCart(updated);
  }

  async clearCart(userId: string) {
    await cartRepository.clearCart(userId);
    return this.formatCart(null);
  }

  async syncCart(userId: string, input: SyncCartInput) {
    const updated = await cartRepository.syncCart(userId, input.items);
    return this.formatCart(updated);
  }
}

export const cartService = new CartService();
