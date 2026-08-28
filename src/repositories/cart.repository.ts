import { prisma } from '../config/database';

export class CartRepository {
  async getOrCreateCart(userId: string) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: { category: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                include: { category: true },
              },
            },
          },
        },
      });
    }

    return cart;
  }

  async findByUserId(userId: string) {
    return prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: { category: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async addItem(userId: string, productId: string, quantity: number, selectedAttributes?: any) {
    const cart = await this.getOrCreateCart(userId);

    const existingItem = cart.items.find((item) => item.productId === productId);

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
          selectedAttributes: selectedAttributes || existingItem.selectedAttributes || undefined,
        },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          selectedAttributes: selectedAttributes || undefined,
        },
      });
    }

    return this.findByUserId(userId);
  }

  async updateItem(userId: string, cartItemId: string, quantity: number) {
    const cart = await this.getOrCreateCart(userId);

    const item = cart.items.find((i) => i.id === cartItemId);
    if (!item) {
      return null;
    }

    if (quantity <= 0) {
      await prisma.cartItem.delete({
        where: { id: cartItemId },
      });
    } else {
      await prisma.cartItem.update({
        where: { id: cartItemId },
        data: { quantity },
      });
    }

    return this.findByUserId(userId);
  }

  async removeItem(userId: string, cartItemId: string) {
    const cart = await this.getOrCreateCart(userId);
    const item = cart.items.find((i) => i.id === cartItemId);
    if (!item) {
      return null;
    }

    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    return this.findByUserId(userId);
  }

  async clearCart(userId: string) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }
  }

  async syncCart(userId: string, guestItems: { productId: string; quantity: number; selectedAttributes?: any }[]) {
    const cart = await this.getOrCreateCart(userId);

    for (const item of guestItems) {
      const existing = cart.items.find((i) => i.productId === item.productId);
      if (existing) {
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: {
            quantity: existing.quantity + item.quantity,
          },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: item.productId,
            quantity: item.quantity,
            selectedAttributes: item.selectedAttributes || undefined,
          },
        });
      }
    }

    return this.findByUserId(userId);
  }
}

export const cartRepository = new CartRepository();
