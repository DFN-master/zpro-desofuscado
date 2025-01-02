import * as Yup from 'yup';
import { Request, Response } from 'express';
import AppError from '../errors/AppErrorZPRO';
import CreateStepsReplyActionService from '../services/AutoReplyServices/CreateStepsReplyActionServiceZPRO';
import DeleteStepsReplyActionService from '../services/AutoReplyServices/DeleteStepsReplyActionServiceZPRO';
import UpdateStepsReplyActionService from '../services/AutoReplyServices/UpdateStepsReplyActionServiceZPRO';

interface StepsReplyActionData {
  stepReplyId: number;
  words: string;
  action: string;
  userId: number;
}

interface UpdateStepsReplyActionRequest {
  stepsReplyActionData: StepsReplyActionData;
  stepsReplyActionId: number;
}

export const store = async (req: Request, res: Response): Promise<Response> => {
  if (req.user.profile !== 'admin' && req.user.profile !== 'super') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  const data = {
    ...req.body,
    userId: req.user.id
  };

  const schema = Yup.object().shape({
    stepReplyId: Yup.number().required(),
    words: Yup.string().required(),
    action: Yup.string().required(),
    userId: Yup.number().required()
  });

  try {
    await schema.validate(data);
  } catch (err) {
    throw new AppError(err.message);
  }

  const stepsReplyAction = await CreateStepsReplyActionService(data);

  return res.status(200).json(stepsReplyAction);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  if (req.user.profile !== 'admin' && req.user.profile !== 'super') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  const data = {
    ...req.body,
    userId: req.user.id
  };

  const schema = Yup.object().shape({
    stepReplyId: Yup.number().required(),
    words: Yup.string().required(),
    action: Yup.string().required(),
    userId: Yup.number().required()
  });

  try {
    await schema.validate(data);
  } catch (err) {
    throw new AppError(err.message);
  }

  const { stepsReplyActionId } = req.params;

  const updateData: UpdateStepsReplyActionRequest = {
    stepsReplyActionData: data,
    stepsReplyActionId
  };

  const stepsReplyAction = await UpdateStepsReplyActionService(updateData);

  return res.status(200).json(stepsReplyAction);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  if (req.user.profile !== 'admin' && req.user.profile !== 'super') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  const { stepsReplyActionId } = req.params;

  await DeleteStepsReplyActionService(stepsReplyActionId);

  return res.status(200).json({ message: 'Auto reply deleted' });
}; 