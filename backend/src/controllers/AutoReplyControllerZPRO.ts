import { Request, Response } from 'express';
import * as Yup from 'yup';
import AppError from '../errors/AppErrorZPRO';
import CreateAutoReplyService from '../services/AutoReplyServices/CreateAutoReplyServiceZPRO';
import ListAutoReplyService from '../services/AutoReplyServices/ListAutoReplyServiceZPRO';
import UpdateAutoReplyService from '../services/AutoReplyServices/UpdateAutoReplyServiceZPRO';
import DeleteAutoReplyService from '../services/AutoReplyServices/DeleteAutoReplyServiceZPRO';

interface StoreData {
  name: string;
  action: string;
  tenantId: number;
  userId: number;
}

interface UpdateData {
  name: string;
  action: string;
  userId: number;
}

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  
  if (req.user.profile !== 'admin' && req.user.profile !== 'super') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  const data: StoreData = {
    ...req.body,
    tenantId
  };

  const schema = Yup.object().shape({
    name: Yup.string().required(),
    action: Yup.number().required(),
    tenantId: Yup.number().required(),
    userId: Yup.number().required()
  });

  try {
    await schema.validate(data);
  } catch (err) {
    throw new AppError(err.message);
  }

  const autoReply = await CreateAutoReplyService(data);
  return res.status(200).json(autoReply);
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const autoReplies = await ListAutoReplyService({ tenantId });
  return res.status(200).json(autoReplies);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  if (req.user.profile !== 'admin' && req.user.profile !== 'super') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  const { tenantId } = req.user;
  const data: UpdateData = req.body;

  const schema = Yup.object().shape({
    name: Yup.string().required(),
    action: Yup.number().required(),
    userId: Yup.number().required()
  });

  try {
    await schema.validate(data);
  } catch (err) {
    throw new AppError(err.message);
  }

  const { autoReplyId } = req.params;

  const autoReply = await UpdateAutoReplyService({
    autoReplyData: data,
    autoReplyId,
    tenantId
  });

  return res.status(200).json(autoReply);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  if (req.user.profile !== 'admin' && req.user.profile !== 'super') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  const { tenantId } = req.user;
  const { autoReplyId } = req.params;

  await DeleteAutoReplyService({
    id: autoReplyId,
    tenantId
  });

  return res.status(200).json({ message: 'Auto reply deleted' });
}; 