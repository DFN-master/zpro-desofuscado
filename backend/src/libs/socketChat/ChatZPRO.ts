import { find, findKey, without, sortBy, fromPairs, toPairs, isNull } from 'lodash';
import { Utils } from './UtilsZPRO';
import { IndexManager } from './IndexZPRO';
import User from '../../models/UserZPRO';
import { logger } from '../../utils/loggerZPRO';
import AppError from '../../errors/AppErrorZPRO';
import { Socket } from 'socket.io';

interface ChatUser {
  id: number;
  username: string;
  email: string;
  tenantId: number;
  profile?: any;
  role?: string;
  isAdmin?: boolean;
  isAgent?: boolean;
  attributes?: any;
}

interface ChatMessage {
  to: number;
  from: number;
  type: 's' | 'r';
  toUser: ChatUser;
  fromUser: ChatUser;
}

interface ChatSession {
  sockets: Socket[];
  usersOnline: {
    [key: string]: {
      sockets: string[];
      user: ChatUser;
    };
  };
  idleUsers: {
    [key: string]: {
      sockets: string[];
      user: ChatUser;
    };
  };
}

class ChatServer {
  private static sessions: { [key: string]: ChatSession } = {};

  static joinChat(socket: Socket): void {
    const { user } = socket.handshake.auth;
    logger.info(`Server USER - joinChat successfully - ${user.username}`);

    const sessionId = `chat_${user.tenantId}`;
    let session = this.sessions[sessionId];

    if (session) {
      session.usersOnline[user.id] = {
        sockets: [socket.id],
        user
      };
      session.sockets.push(socket);
      Utils.sendToSelf(socket, 'joinSuccessfully');
    } else {
      this.sessions[sessionId] = {
        sockets: [],
        usersOnline: {},
        idleUsers: {}
      };
      session = this.sessions[sessionId];
      session.usersOnline[user.id] = {
        sockets: [socket.id],
        user
      };
      session.sockets.push(socket);
      Utils.sendToSelf(socket, `${user.tenantId}:joinSuccessfully`);
    }
  }

  static updateUsers(socket: Socket): void {
    const { user } = socket.handshake.auth;
    const sessionId = `chat_${user.tenantId}`;
    const session = this.sessions[sessionId];
    
    const sortedUsers = sortBy(fromPairs(toPairs(session?.usersOnline)), ([_, userData]) => userData);
    
    sortedUsers.forEach(userData => {
      const { user: chatUser, sockets } = userData;
      
      if (chatUser && sockets.length > 0) {
        sockets.forEach(socketId => {
          const targetSocket = find(session.sockets, s => s.id === socketId);
          if (targetSocket && (chatUser.attributes.isAdmin || chatUser.attributes.isAgent)) {
            targetSocket.emit('users', sortedUsers);
          }
        });
      }
    });
  }

  static onSetUserIdle(socket: Socket): void {
    const { user } = socket.handshake.auth;
    const sessionId = `chat_${user.tenantId}`;

    socket.on(`${user.tenantId}:setUserIdle`, () => {
      let session = this.sessions[sessionId];

      if (session?.usersOnline[user.id]) {
        delete session.usersOnline[user.id];
      }

      if (!session) {
        this.sessions[sessionId] = {
          sockets: [],
          usersOnline: {},
          idleUsers: {}
        };
        session = this.sessions[sessionId];
      }

      session.idleUsers[user.id] = {
        sockets: [socket.id],
        user
      };

      this.updateOnlineBubbles(socket);
    });
  }

  static onSetUserActive(socket: Socket): void {
    const { user } = socket.handshake.auth;
    const sessionId = `chat_${user.tenantId}`;

    socket.on(`${user.tenantId}:setUserActive`, () => {
      let session = this.sessions[sessionId];

      if (session?.idleUsers[user.id]) {
        delete session.idleUsers[user.id];
      }

      if (!session) {
        this.sessions[sessionId] = {
          sockets: [],
          usersOnline: {},
          idleUsers: {}
        };
        session = this.sessions[sessionId];
      }

      session.usersOnline[user.id] = {
        sockets: [socket.id],
        user
      };

      this.updateOnlineBubbles(socket);
    });
  }

  static onChatMessage(socket: Socket): void {
    const { user } = socket.handshake.auth;
    const sessionId = `chat_${user.tenantId}`;

    socket.on('chatMessage', (message: ChatMessage) => {
      const session = this.sessions[sessionId];
      
      if (session) {
        const { to, from } = message;
        logger.info('Server USER - chatMessage TO:', to);
        logger.info('Server USER - chatMessage FROM:', from);

        const originalType = message.type;
        message.type = message.type === 's' ? 'r' : 's';

        Utils.sendToUser(session.sockets, session.usersOnline, message.toUser.username, 'chatMessage', message);
        message.type = originalType;
        Utils.sendToUser(session.sockets, session.usersOnline, message.fromUser.username, 'chatMessage', message);
      }
    });
  }

  static onChatTyping(socket: Socket): void {
    const { user } = socket.handshake.auth;
    const sessionId = `chat_${user.tenantId}`;

    socket.on('chatTyping', (data: { to: number; from: number }) => {
      const session = this.sessions[sessionId];
      
      if (session) {
        const { to, from } = data;
        let toUser = null;
        let fromUser = null;

        find(session.usersOnline, (userData) => {
          if (String(userData.user.id) === String(to)) {
            toUser = userData.user;
          }
          if (String(userData.user.id) === String(from)) {
            fromUser = userData.user;
          }
        });

        if (isNull(toUser) || isNull(fromUser)) return;

        data.toUser = toUser;
        data.fromUser = fromUser;

        Utils.sendToUser(session.sockets, session.usersOnline, toUser.username, 'chatTyping', data);
      }
    });
  }

  static onChatStopTyping(socket: Socket): void {
    const { user } = socket.handshake.auth;
    const sessionId = `chat_${user.tenantId}`;

    socket.on('chatStopTyping', (data: { to: number }) => {
      const session = this.sessions[sessionId];
      
      if (session) {
        const { to } = data;
        let toUser = null;

        find(session.usersOnline, (userData) => {
          if (String(userData.user.id) === String(to)) {
            toUser = userData.user;
          }
        });

        if (isNull(toUser)) return;

        data.toUser = toUser;
        Utils.sendToUser(session.sockets, session.usersOnline, toUser.username, 'chatStopTyping', data);
      }
    });
  }

  static async saveChatWindow(socket: Socket): Promise<void> {
    socket.on('saveChatWindow', async (data: { userId: number; remove: boolean }) => {
      const { userId, remove } = data;
      const user = await User.findByPk(userId);
      
      if (user) {
        // Implementar lógica de salvar/remover janela de chat
      }
    });
  }

  static async onDisconnect(socket: Socket): Promise<void> {
    socket.on('disconnect', async (reason: string) => {
      const { user } = socket.handshake.auth;
      const { tenantId } = user;
      const sessionId = `chat_${tenantId}`;
      const session = this.sessions[sessionId];

      if (session?.usersOnline) {
        if (session.usersOnline[user.id]) {
          const userSockets = session.usersOnline[user.id].sockets;
          if (userSockets.length < 2) {
            delete session.usersOnline[user.id];
          } else {
            session.usersOnline[user.id].sockets = without(userSockets, socket.id);
          }
        }
        const targetSocket = findKey(session.sockets, { id: socket.id });
        session.sockets = without(session.sockets, targetSocket);
      }

      if (session?.idleUsers) {
        if (session.idleUsers[user.id]) {
          const userSockets = session.idleUsers[user.id].sockets;
          if (userSockets.length < 2) {
            delete session.idleUsers[user.id];
          } else {
            session.idleUsers[user.id].sockets = without(userSockets, socket.id);
          }
        }
        const targetSocket = findKey(session.sockets, { id: socket.id });
        session.sockets = without(session.sockets, targetSocket);
      }

      const userRecord = await User.findByPk(user.id);
      if (userRecord) {
        await userRecord.update({
          status: 'offline',
          lastOnline: new Date()
        });
      }

      this.updateOnlineBubbles(socket);

      if (reason === 'transport close') {
        reason = 'client terminated';
      }
      
      logger.warn(`User disconnected (${reason}): ${user.username} - ${socket.id}`);
    });
  }

  static updateOnlineBubbles(socket: Socket): void {
    const { user } = socket.handshake.auth;
    const sessionId = `chat_${user.tenantId}`;
    const session = this.sessions[sessionId];

    const sortedUsers = sortBy(fromPairs(toPairs(session?.usersOnline)), ([_, userData]) => userData);
    const sortedIdle = sortBy(fromPairs(toPairs(session?.idleUsers)), ([_, userData]) => userData);

    Utils.sendToAllConnectedClients(socket, `${user.tenantId}:chat:updateOnlineBubbles`, {
      sortedUsers,
      sortedIdle
    });
  }

  static async getOpenChatWindows(socket: Socket): Promise<void> {
    socket.on('getOpenChatWindows', () => {
      this.spawnChatWindow(socket);
    });
  }

  static async spawnChatWindow(socket: Socket): Promise<void> {
    socket.on('spawnChatWindow', async (userId: number) => {
      const user = await User.findByPk(userId, {
        attributes: ['id', 'username', 'email', 'role']
      });
      Utils.sendToSelf(socket, 'spawnChatWindow', user);
    });
  }

  static register(socket: Socket): void {
    if (!socket.handshake.auth?.user?.id) return;

    this.joinChat(socket);

    // Register event handlers
    this.onSetUserIdle(socket);
    this.onSetUserActive(socket);
    this.onUpdateUsers(socket);
    this.onChatMessage(socket);
    this.onChatTyping(socket);
    this.onChatStopTyping(socket);
    this.saveChatWindow(socket);
    this.onDisconnect(socket);
    this.onUpdateOnlineBubbles(socket);
    this.getOpenChatWindows(socket);
  }

  static eventLoop(socket: Socket): void {
    this.updateUsers(socket);
    this.updateOnlineBubbles(socket);
  }
}

export default ChatServer; 