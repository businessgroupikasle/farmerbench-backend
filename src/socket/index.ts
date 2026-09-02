import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { env } from '../config/env';

let io: SocketIOServer | null = null;

export const initSocketIO = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.corsOrigins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected to Socket.IO: ${socket.id}`);

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
  console.log(`📢 Broadcasting Socket.IO event 'customer:created' for: ${customer.name}`);
  io.emit('customer:created', customer);
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
  console.log(`📢 Broadcasting Socket.IO event 'booking:created': ${booking.serviceName} (${booking.bookingReference})`);
  io.emit('booking:created', booking);
};

export const emitBookingUpdated = (booking: any) => {
  if (!io) return;
  console.log(`📢 Broadcasting Socket.IO event 'booking:updated': ${booking.bookingReference} status -> ${booking.status}`);
  io.emit('booking:updated', booking);
};

