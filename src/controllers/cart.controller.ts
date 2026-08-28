import { Request, Response, NextFunction } from 'express';
import { cartService } from '../services/cart.service';
import { sendSuccess } from '../utils/response';

export class CartController {
  async getCart(req: Request, res: Response, next: NextFunction) {
    try {
      const cart = await cartService.getCart(req.user!.userId);
      return sendSuccess(res, cart);
    } catch (error) {
      next(error);
    }
  }

  async addToCart(req: Request, res: Response, next: NextFunction) {
    try {
      const cart = await cartService.addToCart(req.user!.userId, req.body);
      return sendSuccess(res, cart, 'Item added to cart');
    } catch (error) {
      next(error);
    }
  }

  async updateCartItem(req: Request, res: Response, next: NextFunction) {
    try {
      const cart = await cartService.updateCartItem(
        req.user!.userId,
        req.params.itemId,
        req.body.quantity
      );
      return sendSuccess(res, cart, 'Cart item updated');
    } catch (error) {
      next(error);
    }
  }

  async removeCartItem(req: Request, res: Response, next: NextFunction) {
    try {
      const cart = await cartService.removeCartItem(req.user!.userId, req.params.itemId);
      return sendSuccess(res, cart, 'Item removed from cart');
    } catch (error) {
      next(error);
    }
  }

  async clearCart(req: Request, res: Response, next: NextFunction) {
    try {
      const cart = await cartService.clearCart(req.user!.userId);
      return sendSuccess(res, cart, 'Cart cleared');
    } catch (error) {
      next(error);
    }
  }

  async syncCart(req: Request, res: Response, next: NextFunction) {
    try {
      const cart = await cartService.syncCart(req.user!.userId, req.body);
      return sendSuccess(res, cart, 'Cart synchronized');
    } catch (error) {
      next(error);
    }
  }
}

export const cartController = new CartController();
