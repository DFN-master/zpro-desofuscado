import { Request, Response } from 'express';
import * as Yup from 'yup';
import AppError from '../errors/AppErrorZPRO';
import CreateStepsReplyService from '../services/AutoReplyServices/CreateStepsReplyServiceZPRO';
import UpdateStepsReplyService from '../services/AutoReplyServices/UpdateStepsReplyServiceZPRO';
import DeleteStepsReplyService from '../services/AutoReplyServices/DeleteStepsReplyServiceZPRO';

interface StepsReplyData {
  reply: string;
  idAutoReply: number;
  userId: number;
  initialStep: boolean;
}

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    profile: string;
  };
}

export const store = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  if (req.user.profile !== 'admin' && req.user.profile !== 'super') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  const data: StepsReplyData = {
    ...req.body,
    userId: req.user.id
  };

  const schema = Yup.object().shape({
    reply: Yup.string().required(),
    idAutoReply: Yup.number().required(),
    userId: Yup.number().required(),
    initialStep: Yup.boolean().required()
  });

  try {
    await schema.validate(data);
  } catch (err) {
    throw new AppError(err.message);
  }

  const stepsReply = await CreateStepsReplyService(data);

  return res.status(200).json(stepsReply);
};

export const update = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  if (req.user.profile !== 'admin' && req.user.profile !== 'super') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  const data: StepsReplyData = req.body;

  const schema = Yup.object().shape({
    reply: Yup.string().required(),
    idAutoReply: Yup.number().required(),
    userId: Yup.number().required(),
    initialStep: Yup.boolean().required()
  });

  try {
    await schema.validate(data);
  } catch (err) {
    throw new AppError(err.message);
  }

  const { stepsReplyId } = req.params;

  const stepsReply = await UpdateStepsReplyService({
    stepsReplyData: data,
    stepsReplyId
  });

  return res.status(200).json(stepsReply);
};

export const remove = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  if (req.user.profile !== 'admin' && req.user.profile !== 'super') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  const { stepsReplyId } = req.params;

  await DeleteStepsReplyService(stepsReplyId);

  return res.status(200).json({ message: 'Steps reply deleted' });
}; 