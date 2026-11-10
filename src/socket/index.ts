import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { isAllowedOrigin } from '../config/security';
import { authenticateToken } from '../middlewares/auth.middleware';

let io: SocketIOServer | null = null;

/**
 * Events carrying customer personal data (names, emails, phones, messages) are
 * delivered only to sockets authenticated as an active ADMIN. Public catalogue
 * events (products, categories) are still broadcast to every visitor.
 */
const ADMIN_ROOM = 'admins';

const authenticateSocket = async (socket: Socket, next: (err?: Error) => void) => {
  try {
    const rawToken = socket.handshake.auth?.token;
    const token = typeof rawToken === 'string' ? rawToken.replace(/^Bearer\s+/i, '').trim() : '';
    if (token) {
      // Same checks as HTTP requests: DB role/status and password-bound session.
      const result = await authenticateToken(token);
      if (result.ok) {
        socket.data.userId = result.user.userId;
        socket.data.role = result.user.role;
      }
    }
  } catch {
    // Invalid/expired token: continue as an anonymous (public events only) connection.
  }
  next();
};

export const initSocketIO = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  io.use((socket, next) => {
    void authenticateSocket(socket, next);
  });

  io.on('connection', (socket: Socket) => {
    if (socket.data.role === 'ADMIN') {
      socket.join(ADMIN_ROOM);
    }
    console.log(`🔌 Client connected to Socket.IO: ${socket.id}${socket.data.role === 'ADMIN' ? ' (admin)' : ''}`);

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Client disconnected from Socket.IO: ${socket.id} (${reason})`);
    });

    socket.on('error', (err) => {
      console.error(`❌ Socket error (${socket.id}):`, err);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized. Call initSocketIO first.');
  }
  return io;
};

export const emitCustomerCreated = (customer: {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  crops?: string | null;
  status?: string;
  createdAt: string | Date;
}) => {
  if (!io) return;
  console.log(`📢 Sending Socket.IO event 'customer:created' to admins (${customer.id})`);
  io.to(ADMIN_ROOM).emit('customer:created', customer);
};

export const emitProductCreated = (product: any) => {
  if (!io) return;
  console.log(`📢 Broadcasting Socket.IO event 'product:created': ${product.title} (${product.id})`);
  io.emit('product:created', product);
};

export const emitProductUpdated = (product: any) => {
  if (!io) return;
  console.log(`📢 Broadcasting Socket.IO event 'product:updated': ${product.title} (${product.id})`);
  io.emit('product:updated', product);
};

export const emitProductDeleted = (payload: { id: string }) => {
  if (!io) return;
  console.log(`📢 Broadcasting Socket.IO event 'product:deleted': (${payload.id})`);
  io.emit('product:deleted', payload);
};

export const emitCategoryCreated = (category: any) => {
  if (!io) return;
  console.log(`📢 Broadcasting Socket.IO event 'category:created': ${category.name} (${category.id})`);
  io.emit('category:created', category);
};

export const emitCategoryUpdated = (category: any) => {
  if (!io) return;
  console.log(`📢 Broadcasting Socket.IO event 'category:updated': ${category.name} (${category.id})`);
  io.emit('category:updated', category);
};

export const emitCategoryDeleted = (payload: { id: string }) => {
  if (!io) return;
  console.log(`📢 Broadcasting Socket.IO event 'category:deleted': (${payload.id})`);
  io.emit('category:deleted', payload);
};

export const emitBookingCreated = (booking: any) => {
  if (!io) return;
  console.log(`📢 Sending Socket.IO event 'booking:created' to admins: ${booking.serviceName} (${booking.bookingReference})`);
  io.to(ADMIN_ROOM).emit('booking:created', booking);
};

export const emitBookingUpdated = (booking: any) => {
  if (!io) return;
  console.log(`📢 Sending Socket.IO event 'booking:updated' to admins: ${booking.bookingReference} status -> ${booking.status}`);
  io.to(ADMIN_ROOM).emit('booking:updated', booking);
};


export const emitContactCreated = (contact: any) => {
  if (!io) return;
  io.to(ADMIN_ROOM).emit('contact:created', contact);
};

export const emitContactUpdated = (contact: any) => {
  if (!io) return;
  io.to(ADMIN_ROOM).emit('contact:updated', contact);
};
