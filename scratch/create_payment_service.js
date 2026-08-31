import { apiClient } from './api';
import { ApiResponse } from '@formerbench/shared';

export interface RazorpayOrderData {
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  customerName: string;
  customerEmail: string;
}

export const paymentService = {
  async createRazorpayOrder(orderId: string): Promise<ApiResponse<RazorpayOrderData>> {
    return apiClient.post('/payments/create-order', { orderId });
  },

  async verifyPayment(data: {
    orderId: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<ApiResponse<any>> {
    return apiClient.post('/payments/verify', data);
  },
};
