import { Request, Response } from 'express';
import * as Yup from 'yup';
import AppErrorZPRO from '../errors/AppErrorZPRO';
import CreateQueueServiceZPRO from '../services/QueueServices/CreateQueueServiceZPRO';
import ListQueueServiceZPRO from '../services/QueueServices/ListQueueServiceZPRO';
import DeleteQueueServiceZPRO from '../services/QueueServices/DeleteQueueServiceZPRO';
import UpdateQueueServiceZPRO from '../services/QueueServices/UpdateQueueServiceZPRO';

interface QueueData {
  queue: string;
  userId: number;
  tenantId: number;
  isActive?: boolean;
}

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    profile: string;
  };
}

export const store = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  if (req.user.profile !== 'admin' && req.user.profile !== 'super') {
    throw new AppErrorZPRO('ERR_NO_PERMISSION', 403);
  }

  const queueData: QueueData = {
    ...req.body,
    userId: req.user.id,
    tenantId
  };

  const schema = Yup.object().shape({
    queue: Yup.string().required(),
    userId: Yup.number().required(),
    tenantId: Yup.number().required()
  });

  try {
    await schema.validate(queueData);
  } catch (err) {
    throw new AppErrorZPRO(err.message);
  }

  const queue = await CreateQueueServiceZPRO(queueData);
  return res.status(200).json(queue);
};

export const index = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const queues = await ListQueueServiceZPRO({ tenantId });
  return res.status(200).json(queues);
};

export const update = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  if (req.user.profile !== 'admin' && req.user.profile !== 'super') {
    throw new AppErrorZPRO('ERR_NO_PERMISSION', 403);
  }

  const queueData: QueueData = {
    ...req.body,
    userId: req.user.id,
    tenantId
  };

  const schema = Yup.object().shape({
    queue: Yup.string().required(),
    isActive: Yup.boolean().required(),
    userId: Yup.number().required()
  });

  try {
    await schema.validate(queueData);
  } catch (err) {
    throw new AppErrorZPRO(err.message);
  }

  const { queueId } = req.params;
  const queue = await UpdateQueueServiceZPRO({
    queueData,
    queueId: Number(queueId)
  });

  return res.status(200).json(queue);
};

export const remove = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  if (req.user.profile !== 'admin' && req.user.profile !== 'super') {
    throw new AppErrorZPRO('ERR_NO_PERMISSION', 403);
  }

  const { queueId } = req.params;
  
  await DeleteQueueServiceZPRO({
    id: Number(queueId),
    tenantId
  });

  return res.status(200).json({ message: 'Queue deleted' });
}; 