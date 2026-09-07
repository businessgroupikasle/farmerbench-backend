import { contactRepository } from '../repositories/contact.repository';
import { emitContactCreated, emitContactUpdated } from '../socket';
import { AppError } from '../utils/response';

interface CreateContactInput { name: string; email: string; phone: string; subject: string; message: string; }

export class ContactService {
  async submitContact(data: CreateContactInput) {
    const contact = await contactRepository.create(data);
    emitContactCreated(contact);
    return contact;
  }
  async getAllContacts(page = 1, limit = 20) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    return contactRepository.findAll((safePage - 1) * safeLimit, safeLimit);
  }
  async getContactById(id: string) {
    const contact = await contactRepository.findById(id);
    if (!contact) throw new AppError('Contact not found', 404);
    return contact;
  }
  async markAsRead(id: string) {
    await this.getContactById(id);
    const contact = await contactRepository.updateStatus(id, true);
    emitContactUpdated(contact);
    return contact;
  }
  async deleteContact(id: string) {
    await this.getContactById(id);
    return contactRepository.delete(id);
  }
  async getDashboardStats() {
    const [unreadCount, result] = await Promise.all([contactRepository.getUnreadCount(), contactRepository.findAll(0, 1)]);
    return { totalContacts: result.total, unreadCount };
  }
}
export const contactService = new ContactService();
