import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { emailService } from './email.service';

type OrderForEmail = Prisma.OrderGetPayload<{
  include: {
    items: true;
    shippingAddress: true;
    payment: true;
    user: { select: { id: true; name: true; email: true } };
  };
}>;

const escapeHtml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const money = (value: number) => `₹${Number(value || 0).toLocaleString('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

const formatDate = (date: Date) => new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Kolkata',
}).format(date);

const paymentMethodLabel = (method: string) => method === 'RAZORPAY' ? 'Razorpay' : 'Cash on Delivery';
const paymentStatusLabel = (order: OrderForEmail) =>
  order.paymentMethod === 'CASH_ON_DELIVERY' && order.paymentStatus === 'PENDING'
    ? 'Pending (pay on delivery)'
    : order.paymentStatus.charAt(0) + order.paymentStatus.slice(1).toLowerCase();

const addressHtml = (order: OrderForEmail) => {
  const address = order.shippingAddress;
  return [address.street, address.city, address.state, address.postalCode, address.country]
    .filter(Boolean)
    .map(escapeHtml)
    .join(', ');
};

const itemRows = (order: OrderForEmail) => order.items.map((item) => {
  const attributes = (item.selectedAttributes as { packSize?: string } | null) || {};
  const variant = attributes.packSize
    ? `<div style="font-size:12px;color:#64748b;margin-top:3px;">Pack: ${escapeHtml(attributes.packSize)}</div>`
    : '';
  return `<tr>
    <td style="padding:12px 8px;border-bottom:1px solid #e2e8f0;color:#0f172a;">${escapeHtml(item.title)}${variant}</td>
    <td style="padding:12px 8px;border-bottom:1px solid #e2e8f0;text-align:center;">${item.quantity}</td>
    <td style="padding:12px 8px;border-bottom:1px solid #e2e8f0;text-align:right;white-space:nowrap;">${money(item.price)}</td>
    <td style="padding:12px 8px;border-bottom:1px solid #e2e8f0;text-align:right;white-space:nowrap;font-weight:600;">${money(item.price * item.quantity)}</td>
  </tr>`;
}).join('');

const totalsHtml = (order: OrderForEmail) => `
  <table role="presentation" style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px;">
    <tr><td style="padding:5px 0;color:#64748b;">Subtotal</td><td style="padding:5px 0;text-align:right;">${money(order.itemsPrice)}</td></tr>
    <tr><td style="padding:5px 0;color:#64748b;">Delivery charge</td><td style="padding:5px 0;text-align:right;">${money(order.shippingPrice)}</td></tr>
    ${order.discountPrice > 0 ? `<tr><td style="padding:5px 0;color:#15803d;">Discount${order.couponCode ? ` (${escapeHtml(order.couponCode)})` : ''}</td><td style="padding:5px 0;text-align:right;color:#15803d;">-${money(order.discountPrice)}</td></tr>` : ''}
    <tr><td style="padding:12px 0 5px;border-top:1px solid #cbd5e1;font-size:16px;font-weight:700;color:#0f4726;">Final total</td><td style="padding:12px 0 5px;border-top:1px solid #cbd5e1;text-align:right;font-size:16px;font-weight:700;color:#0f4726;">${money(order.totalPrice)}</td></tr>
  </table>`;

const emailShell = (content: string) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:20px;background:#f4f7f4;font-family:Arial,'Segoe UI',sans-serif;color:#1e293b;">
  <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;box-shadow:0 4px 14px rgba(15,71,38,.08);">
    <div style="padding:26px 24px;text-align:center;background:linear-gradient(135deg,#0f4726,#15803d);color:#ffffff;">
      <div style="font-size:26px;font-weight:800;">FarmerBench</div>
      <div style="margin-top:6px;font-size:13px;color:#d1fae5;">AgriEra • Direct-to-Farmer Commerce & Services</div>
    </div>
    <div style="padding:26px 22px;">${content}</div>
    <div style="padding:16px 22px;text-align:center;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;">© ${new Date().getFullYear()} FarmerBench / AgriEra. All rights reserved.</div>
  </div>
</body></html>`;

const orderTable = (order: OrderForEmail) => `<div style="overflow-x:auto;margin-top:18px;">
  <table style="width:100%;border-collapse:collapse;font-size:13px;min-width:520px;">
    <thead><tr style="background:#f1f5f9;color:#475569;">
      <th style="padding:10px 8px;text-align:left;">Product</th><th style="padding:10px 8px;text-align:center;">Qty</th><th style="padding:10px 8px;text-align:right;">Unit price</th><th style="padding:10px 8px;text-align:right;">Item total</th>
    </tr></thead><tbody>${itemRows(order)}</tbody>
  </table></div>`;

export class OrderEmailService {
  async notifyOrderConfirmed(orderId: string) {
    const results = await Promise.allSettled([
      this.sendCustomerConfirmation(orderId),
      this.sendAdminNotification(orderId),
    ]);
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Order ${orderId} ${index === 0 ? 'customer' : 'admin'} email notification failed:`, result.reason);
      }
    });
  }

  private async getOrder(orderId: string) {
    return prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        shippingAddress: true,
        payment: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  private async sendCustomerConfirmation(orderId: string) {
    const claimedAt = new Date();
    const claim = await prisma.order.updateMany({
      where: {
        id: orderId,
        customerOrderEmailSentAt: null,
        OR: [
          { paymentMethod: 'CASH_ON_DELIVERY', orderStatus: { not: 'CANCELLED' } },
          { paymentMethod: 'RAZORPAY', paymentStatus: 'PAID' },
        ],
      },
      data: { customerOrderEmailSentAt: claimedAt },
    });
    if (claim.count === 0) return;

    try {
      const order = await this.getOrder(orderId);
      if (!order) throw new Error('Order not found after notification claim');
      const orderUrl = `${env.FRONTEND_URL.replace(/\/$/, '')}/order-confirmation/${encodeURIComponent(order.id)}`;
      const subject = `Thank You for Your Order – Order #${order.id}`;
      const html = emailShell(`
        <h1 style="margin:0 0 10px;color:#0f4726;font-size:24px;">Thank you for your order! 🎉</h1>
        <p style="margin:0 0 18px;line-height:1.6;color:#475569;">Your order <strong>#${escapeHtml(order.id)}</strong> has been successfully confirmed. We appreciate your order and look forward to delivering your products to you.</p>
        <div style="padding:14px 16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;font-size:14px;line-height:1.8;">
          <strong>Order ID:</strong> #${escapeHtml(order.id)}<br><strong>Order date:</strong> ${formatDate(order.createdAt)}<br><strong>Order status:</strong> Confirmed<br><strong>Payment:</strong> ${paymentMethodLabel(order.paymentMethod)}<br><strong>Payment status:</strong> ${paymentStatusLabel(order)}
        </div>
        ${orderTable(order)}${totalsHtml(order)}
        <div style="margin-top:20px;padding:16px;background:#f8fafc;border-radius:10px;font-size:14px;line-height:1.7;">
          <strong style="color:#0f4726;">Delivery details</strong><br>${escapeHtml(order.shippingAddress.fullName)}<br>${addressHtml(order)}<br>${order.shippingAddress.phone ? `Phone: ${escapeHtml(order.shippingAddress.phone)}` : ''}
        </div>
        <p style="margin:18px 0 0;color:#64748b;font-size:13px;line-height:1.5;">Your order is being prepared. Delivery updates will be available in your account.</p>
        <div style="text-align:center;margin-top:22px;"><a href="${escapeHtml(orderUrl)}" style="display:inline-block;padding:12px 22px;background:#15803d;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;">View Your Order</a></div>`);
      const text = `Thank you for your order!\n\nOrder #${order.id} has been successfully confirmed.\nOrder date: ${formatDate(order.createdAt)}\nTotal: ${money(order.totalPrice)}\nPayment: ${paymentMethodLabel(order.paymentMethod)} (${paymentStatusLabel(order)})\n\nView order: ${orderUrl}`;
      await emailService.sendMail({ to: order.user.email, subject, html, text });
    } catch (error) {
      await prisma.order.updateMany({ where: { id: orderId, customerOrderEmailSentAt: claimedAt }, data: { customerOrderEmailSentAt: null } });
      throw error;
    }
  }

  private async sendAdminNotification(orderId: string) {
    if (!env.ORDER_NOTIFICATION_ADMIN_EMAIL) {
      console.warn(`Order ${orderId} admin email skipped: ORDER_NOTIFICATION_ADMIN_EMAIL is not configured.`);
      return;
    }
    const claimedAt = new Date();
    const claim = await prisma.order.updateMany({
      where: {
        id: orderId,
        adminOrderEmailSentAt: null,
        OR: [
          { paymentMethod: 'CASH_ON_DELIVERY', orderStatus: { not: 'CANCELLED' } },
          { paymentMethod: 'RAZORPAY', paymentStatus: 'PAID' },
        ],
      },
      data: { adminOrderEmailSentAt: claimedAt },
    });
    if (claim.count === 0) return;

    try {
      const order = await this.getOrder(orderId);
      if (!order) throw new Error('Order not found after notification claim');
      const adminUrl = `${env.FRONTEND_URL.replace(/\/$/, '')}/admin`;
      const subject = `New Order Received – Order #${order.id}`;
      const html = emailShell(`
        <h1 style="margin:0 0 10px;color:#0f4726;font-size:24px;">New Order Received! 🚨</h1>
        <p style="margin:0 0 18px;line-height:1.6;color:#475569;">A new order has been successfully placed on FarmerBench.</p>
        <div style="padding:14px 16px;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;font-size:14px;line-height:1.8;">
          <strong>Order ID:</strong> #${escapeHtml(order.id)}<br><strong>Order date/time:</strong> ${formatDate(order.createdAt)}<br><strong>Order status:</strong> Confirmed<br><strong>Payment:</strong> ${paymentMethodLabel(order.paymentMethod)}<br><strong>Payment status:</strong> ${paymentStatusLabel(order)}
        </div>
        <div style="margin-top:18px;padding:16px;background:#f8fafc;border-radius:10px;font-size:14px;line-height:1.7;">
          <strong style="color:#0f4726;">Customer details</strong><br>Name: ${escapeHtml(order.user.name)}<br>Email: ${escapeHtml(order.user.email)}<br>${order.shippingAddress.phone ? `Phone: ${escapeHtml(order.shippingAddress.phone)}<br>` : ''}Address: ${addressHtml(order)}
        </div>
        ${orderTable(order)}${totalsHtml(order)}
        <div style="text-align:center;margin-top:22px;"><a href="${escapeHtml(adminUrl)}" style="display:inline-block;padding:12px 22px;background:#0f4726;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;">Open Admin Dashboard</a></div>`);
      const text = `New order received.\n\nOrder #${order.id}\nDate: ${formatDate(order.createdAt)}\nCustomer: ${order.user.name} (${order.user.email})\nPhone: ${order.shippingAddress.phone || 'Not provided'}\nTotal: ${money(order.totalPrice)}\nPayment: ${paymentMethodLabel(order.paymentMethod)} (${paymentStatusLabel(order)})\nOrder status: Confirmed\n\nAdmin dashboard: ${adminUrl}`;
      await emailService.sendMail({ to: env.ORDER_NOTIFICATION_ADMIN_EMAIL, subject, html, text });
    } catch (error) {
      await prisma.order.updateMany({ where: { id: orderId, adminOrderEmailSentAt: claimedAt }, data: { adminOrderEmailSentAt: null } });
      throw error;
    }
  }
}

export const orderEmailService = new OrderEmailService();