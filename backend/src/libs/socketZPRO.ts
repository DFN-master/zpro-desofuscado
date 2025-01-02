import { Server as SocketIO, Socket } from 'socket.io';
import { Server } from 'http';
import AppErrorZPRO from '../errors/AppErrorZPRO';
import decodeTokenSocketZPRO from './decodeTokenSocketZPRO';
import { logger } from '../utils/loggerZPRO';
import UserZPRO from '../models/UserZPRO';
import ChatZPRO from './socketChat/ChatZPRO';

interface AuthenticatedSocket extends Socket {
  handshake: {
    auth: {
      token: string;
      user: any;
    };
  };
}

let io: SocketIO;

export const initIO = (httpServer: Server): SocketIO => {
  io = new SocketIO(httpServer, {
    cors: {
      origin: '*'
    },
    pingTimeout: 120000, // 2 minutes
    pingInterval: 45000  // 45 seconds
  });

  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket?.handshake?.auth?.token;

      if (!token) {
        throw new Error('Client connection unauthorized: Token not provided');
      }

      const decoded = decodeTokenSocketZPRO(token);

      if (decoded.isValid) {
        const authInfo = socket?.handshake?.auth;

        socket.handshake.auth = {
          ...authInfo,
          ...decoded.user,
          id: String(decoded.user.id),
          tenantId: String(decoded.user.tenantId)
        };

        const user = await UserZPRO.findByPk(decoded.user.id, {
          attributes: [
            'id',
            'tenantId', 
            'name',
            'email',
            'profile',
            'status',
            'lastLogin',
            'lastOnline'
          ]
        });

        socket.handshake.auth.user = user;
        next();
      }

      next(new Error('Authentication failed'));

    } catch (err) {
      logger.warn('Socket authentication error for socket:', socket);
      socket.emit('auth_error', `Authentication error: ${socket.id}`);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const { tenantId } = socket.handshake.auth;

    if (tenantId) {
      logger.info({
        message: ':::: ZDG :::: Client connected in tenant',
        data: socket.handshake.auth
      });

      try {
        // Join tenant room
        socket.join(tenantId.toString());

        // Handle chat box events
        socket.on(`${tenantId}:joinChatBox`, (boxId: string) => {
          logger.info(`:::: Z-PRO :::: Client joined to chat box channel ${tenantId}:${boxId}`);
          socket.join(`${tenantId}:${boxId}`);
        });

        // Handle notification events  
        socket.on(`${tenantId}:joinNotification`, () => {
          logger.info(`:::: Z-PRO :::: Client joined notification channel ${tenantId}:notification warning.`);
          socket.join(`${tenantId}:notification`);
        });

        // Handle ticket events
        socket.on(`${tenantId}:joinTickets`, (status: string) => {
          logger.info(`:::: Z-PRO :::: Client joined to tickets channel ${tenantId}:${status} channel.`);
          socket.join(`${tenantId}:${status}`);
        });

        // Register chat handlers
        ChatZPRO.register(socket);

      } catch (err) {
        // Silent error handling
      }
    }

    socket.on('disconnect', (reason: string) => {
      logger.info({
        message: `:::: Z-PRO :::: Client disconnected , ${tenantId}, ${reason}`
      });
    });
  });

  return io;
};

export const getIO = (): SocketIO => {
  if (!io) {
    throw new AppErrorZPRO('Socket not initialized');
  }
  return io;
}; 