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
  if (!io) {
    console.warn('⚠️ Cannot emit customer:created - Socket.IO not initialized');
    return;
  }

  console.log(`⚡ Broadcasting Socket.IO event 'customer:created' for: ${customer.name} (${customer.email})`);
  io.emit('customer:created', customer);
};
