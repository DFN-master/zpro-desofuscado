import { Request, Response } from 'express';
import * as Yup from 'yup';
import { getIO } from '../libs/socketZPRO';
import AppError from '../errors/AppErrorZPRO';

import ListGreetingMessageService from '../services/GreetingMessage/ListGreetingMessageServiceZPRO';
import CreateGreetingMessageService from '../services/GreetingMessage/CreateGreetingMessageServiceZPRO';
import ShowGreetingMessageService from '../services/GreetingMessage/ShowGreetingMessageServiceZPRO';
import UpdateGreetingMessageService from '../services/GreetingMessage/UpdateGreetingMessageServiceZPRO';
import DeleteGreetingMessageService from '../services/GreetingMessage/DeleteGreetingMessageServiceZPRO';
import DeleteAllGreetingMessageService from '../services/GreetingMessage/DeleteAllGreetingMessageServiceZPRO';

interface GreetingMessageData {
  message: string;
  whatsappId: number;
  groupId: number;
  userId: number;
  tenantId: number;
}

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    tenantId: number;
  };
}

export const index = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query;
  const { tenantId } = req.user;

  const { greetingMessage, count, hasMore } = await ListGreetingMessageService({
    searchParam: searchParam as string,
    pageNumber: pageNumber as string,
    tenantId
  });

  return res.json({
    greetingMessage,
    count,
    hasMore
  });
};

export const store = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { tenantId, id } = req.user;
  const { message, whatsappId, groupId } = req.body;

  const schema = Yup.object().shape({
    groupId: Yup.string().required(),
    message: Yup.string().required(),
    userId: Yup.number().required(),
    tenantId: Yup.number().required()
  });

  const greetingMessages = [];

  for (const group of groupId) {
    const data: GreetingMessageData = {
      message,
      whatsappId,
      groupId: group.id,
      userId: parseInt(id),
      tenantId
    };

    try {
      await schema.validate(data);
      const greetingMessage = await CreateGreetingMessageService(data);
      greetingMessages.push(greetingMessage);
    } catch (err) {
      throw new AppError((err as Error).message);
    }
  }

  return res.status(200).json(greetingMessages);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { greetingMessageId } = req.params;
  const greetingMessage = await ShowGreetingMessageService(greetingMessageId);
  return res.status(200).json(greetingMessage);
};

export const update = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const data = {
    ...req.body,
    userId: req.user.id,
    tenantId
  };

  const schema = Yup.object().shape({
    groupId: Yup.string(),
    message: Yup.string(),
    userId: Yup.number().required()
  });

  try {
    await schema.validate(data);
  } catch (err) {
    throw new AppError((err as Error).message);
  }

  const { greetingMessageId } = req.params;
  
  const greetingMessage = await UpdateGreetingMessageService({
    greetingMessageData: data,
    greetingMessageId
  });

  const io = getIO();
  io.emit('greetingMessage', {
    action: 'update',
    greetingMessage
  });

  return res.status(200).json(greetingMessage);
};

export const remove = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { greetingMessageId } = req.params;

  await DeleteGreetingMessageService(greetingMessageId, tenantId);

  const io = getIO();
  io.emit('greetingMessage', {
    action: 'delete',
    greetingMessageId
  });

  return res.status(200).json({ message: 'Greeting Message deleted' });
};

export const removeAll = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  await DeleteAllGreetingMessageService(tenantId);

  const io = getIO();
  io.emit('greetingMessage', { action: 'delete' });

  return res.status(200).json({ message: 'All Greeting Messages deleted' });
}; 