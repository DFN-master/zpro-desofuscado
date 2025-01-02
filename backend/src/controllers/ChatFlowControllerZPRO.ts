import { Request, Response } from 'express';
import CreateChatFlowService from '../services/ChatFlowServices/CreateChatFlowServiceZPRO';
import ListChatFlowService from '../services/ChatFlowServices/ListChatFlowServiceZPRO';
import AppError from '../errors/AppErrorZPRO';
import UpdateChatFlowService from '../services/ChatFlowServices/UpdateChatFlowServiceZPRO';
import DeleteChatFlowService from '../services/ChatFlowServices/DeleteChatFlowServiceZPRO';
import ChatFlow from '../models/ChatFlowZPRO';
import ImportChatFlowService from '../services/ChatFlowServices/ImportChatFlowServiceZPRO';

interface StoreRequestBody {
  flow: any;
  name: string;
}

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    profile: string;
    tenantId: number;
  };
}

export const store = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  if (req.user.profile !== 'admin' && req.user.profile !== 'super') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  const chatFlowData = {
    flow: { ...req.body },
    name: req.body.name,
    isActive: true,
    userId: +req.user.id,
    tenantId
  };

  const flow = await CreateChatFlowService(chatFlowData);
  return res.status(200).json(flow);
};

export const storeDuplicate = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  if (req.user.profile !== 'admin' && req.user.profile !== 'super') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  const existingFlow = await ChatFlow.findOne({
    where: {
      id: req.body.id,
      tenantId
    }
  });

  const chatFlowData = {
    flow: { ...existingFlow?.flow },
    name: req.body.name,
    isActive: true,
    userId: +req.user.id,
    tenantId
  };

  const flow = await CreateChatFlowService(chatFlowData);
  return res.status(200).json(flow);
};

export const index = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const flows = await ListChatFlowService({ tenantId });
  return res.status(200).json(flows);
};

export const update = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  if (req.user.profile !== 'admin' && req.user.profile !== 'super') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  const { tenantId } = req.user;
  const chatFlowData = {
    flow: { ...req.body },
    name: req.body.name,
    isActive: req.body.isActive,
    userId: +req.user.id,
    tenantId
  };

  const { chatFlowId } = req.params;

  const flow = await UpdateChatFlowService({
    chatFlowData,
    chatFlowId,
    tenantId
  });

  return res.status(200).json(flow);
};

export const importFlow = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  if (req.user.profile !== 'admin' && req.user.profile !== 'super') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  const { tenantId } = req.user;
  const chatFlowData = {
    flow: { ...req.body },
    tenantId
  };

  const { chatFlowId } = req.params;

  const flow = await ImportChatFlowService({
    chatFlowData,
    chatFlowId,
    tenantId
  });

  return res.status(200).json(flow);
};

export const remove = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { chatFlowId } = req.params;
  const { tenantId } = req.user;

  await DeleteChatFlowService({ id: chatFlowId, tenantId });

  return res.status(200).json({ message: 'Flow deleted' });
}; 