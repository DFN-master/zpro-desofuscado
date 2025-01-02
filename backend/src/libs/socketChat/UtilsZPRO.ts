import { find, forEach, fromPairs, isNull, isUndefined, each, map, sortBy } from 'lodash';
import { Server, Socket } from 'socket.io';

interface SocketData {
  id: string;
  sockets: any;
  [key: string]: any;
}

// Função para ordenar objeto por chaves
export const sortByKeys = (obj: Record<string, any>): Record<string, any> => {
  const keys = Object.keys(obj);
  const sortedKeys = sortBy(keys);
  return fromPairs(map(sortedKeys, key => [key, obj[key]]));
};

// Envia mensagem para o próprio socket
export const sendToSelf = (socket: Socket, event: string, data: any = {}): void => {
  socket.emit(event, data);
};

// Envia mensagem para um socket específico
export const _sendToSelf = (io: Server, socketId: string, event: string, data: any): void => {
  each(io.sockets.sockets, socket => {
    if (socket.id === socketId) {
      socket.emit(event, data);
    }
  });
};

// Envia mensagem para todos os clientes conectados
export const sendToAllConnectedClients = (socket: Socket, event: string, data: any): void => {
  socket.emit(event, data);
};

// Envia mensagem para todos os clientes em uma sala específica
export const sendToAllClientsInRoom = (io: Server, room: string, event: string, data: any): void => {
  io.sockets.in(room).emit(event, data);
};

// Envia mensagem para um usuário específico
export const sendToUser = (
  sockets: Record<string, SocketData>,
  users: Record<string, any>,
  userId: string,
  event: string,
  data: any
): boolean => {
  let socketId = null;

  forEach(users, (user, id) => {
    if (id.toLowerCase() === userId.toLowerCase()) {
      socketId = user;
      return true;
    }
  });

  if (isNull(socketId)) return true;

  forEach(socketId?.sockets, socketInstance => {
    const foundSocket = find(sockets, { id: socketInstance });
    
    if (foundSocket) {
      const socket = sockets[foundSocket] || null;
      if (isUndefined(socket)) return true;
      socket.emit(event, data);
    }
  });

  return false;
};

// Envia mensagem para todos exceto um socket específico
export const sendToAllExcept = (io: Server, socketId: string, event: string, data: any): void => {
  each(io.sockets.sockets, socket => {
    if (socket.id !== socketId) {
      socket.emit(event, data);
    }
  });
};

// Desconecta todos os clientes
export const disconnectAllClients = (io: Server): void => {
  Object.keys(io.sockets.sockets).forEach(socketId => {
    io.sockets.sockets[socketId].disconnect(true);
  });
};

// Estratégia de reconexão personalizada
export const customRetryStrategy = (retryCount: number): number => {
  return Math.min(retryCount * 1000, 5000);
}; 