import { Request, Response } from 'express';
import { getIO } from '../libs/socketZPRO';
import PrivateMessageService from '../services/PrivateMessage/PrivateMessageServiceZPRO';
import ReadPrivateMessageService from '../services/PrivateMessage/ReadPrivateMessageMessageServiceZPRO';
import ListPrivateMessageUnreadService from '../services/PrivateMessage/ListPrivateMessageUnreadMessageZPRO';
import ListGroupMessageUnreadService from '../services/PrivateMessage/ListGroupMessageUnreadMessageZPRO';
import PrivateMessage from '../models/PrivateMessageZPRO';
import User from '../models/UserZPRO';
import { logger } from '../utils/loggerZPRO';
import { v4 as uuidv4 } from 'uuid';

interface MessageData {
  receiverId: number;
  isGroup: boolean;
  text: string;
  timestamp: string;
  mediaType?: string;
  mediaUrl?: string;
  groupId?: number | null;
  senderId?: number;
  tenantId?: number;
}

interface MessageFile {
  filename?: string;
  mimetype: string;
  originalname: string;
}

export const listPrivateCountUnreadMessage = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.user;
    const count = await new ListPrivateMessageUnreadService(id);

    return res.status(200).json({ count });
  } catch (err) {
    return res.status(500).json({ error: 'ERR_COUNT_SYSTEM' });
  }
};

export const listGroupCountUnreadMessage = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.user;
    const count = await new ListGroupMessageUnreadService(id);

    return res.status(200).json({ count });
  } catch (err) {
    return res.status(500).json({ error: 'ERR_COUNT_SYSTEM' });
  }
};

export const createPrivateMessage = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id: senderId, tenantId } = req.user;
    const io = getIO();
    const { receiverId, isGroup, text, timestamp } = req.body;
    const files = req.files as MessageFile[];

    const messageData: MessageData = {
      text,
      timestamp,
      receiverId,
      senderId,
      tenantId,
      groupId: null,
      mediaType: 'text',
      mediaUrl: undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (isGroup === true || isGroup === 'true') {
      messageData.receiverId = undefined;
      messageData.groupId = receiverId;
    }

    let message: PrivateMessage;

    if (files && files.length > 0) {
      await Promise.all(
        files.map(async file => {
          try {
            if (!file.filename) {
              const ext = file.mimetype.split('/')[1].split(';')[0];
              const uniquePrefix = uuidv4().replace(/-/g, '').substring(0, 20);
              file.filename = `${new Date().getTime()}_${uniquePrefix}.${ext}`;
            }
          } catch (err) {
            logger.error(err);
          }

          const messageWithMedia = {
            ...messageData,
            mediaType: file.mimetype || file.mimetype.substr(0, file.mimetype.indexOf('/')),
            mediaUrl: file.filename,
            text: file.originalname
          };

          const newMessage = await PrivateMessageService.createPrivateMessage(messageWithMedia);
          message = await PrivateMessage.findByPk(newMessage.id);

          if (!message) throw new Error('ERR_CREATING_MESSAGE');
        })
      );
    } else {
      message = await PrivateMessageService.createPrivateMessage(messageData);
    }

    if (!message) throw new Error('ERR_CREATING_MESSAGE');

    const messageCreated = await PrivateMessage.findOne({
      where: { id: message.id },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!messageCreated) throw new Error('ERR_CREATING_MESSAGE_SYSTEM');

    const msgData = {
      id: messageCreated.id,
      groupId: messageCreated.groupId,
      mediaType: messageCreated.mediaType,
      mediaUrl: messageCreated.mediaUrl,
      timestamp: messageCreated.timestamp,
      senderId,
      receiverId: messageCreated.receiverId,
      text: messageCreated.text,
      status: messageCreated.status,
      sender: messageCreated.sender,
    };

    io.emit(`${tenantId}:private-msg`, {
      action: 'create',
      data: msgData
    });

    io.emit(`${tenantId}:private-msg-notification`, {
      action: 'create',
      data: {
        id: messageCreated.id,
        groupId: receiverId,
        senderId,
        mediaType: messageCreated.mediaType,
        receiverId: messageCreated.receiverId,
        text: messageCreated.text,
        timestamp: messageCreated.timestamp,
        status: messageCreated.status,
      }
    });

    return res.status(200).json({ message: messageCreated });
  } catch (err) {
    return res.status(500).json({ error: 'ERR_CREATE_MESSAGE_SERVICE' });
  }
};

export const markAsRead = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { contactId } = req.params;
    const { id: userId, tenantId } = req.user;
    const { isGroup } = req.body;
    const io = getIO();

    await new ReadPrivateMessageService({
      userId,
      senderId: contactId,
      isGroup
    });

    io.emit(`${tenantId}:msg-private-unread-messages`, {
      action: 'create',
      data: {
        receiverId: userId,
        isGroup,
        senderId: Number(contactId)
      }
    });

    return res.status(200).json({ status: 'MESSAGES.MARK_AS_READ.' });
  } catch (err) {
    return res.status(500).json({ error: 'ERR_MARK_MESSAGES_AS_READ.' });
  }
};

export const listPrivateMessage = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { isGroup } = req.query;
    const { id } = req.user;
    const { userId } = req.params;
    
    const messages = await PrivateMessageService.listPrivateMessage(id, userId, isGroup);
    
    return res.status(200).json({ messages });
  } catch (err) {
    return res.status(500).json({ error: 'ERR_LIST_MESSAGES' });
  }
}; 