import { Request, Response } from 'express';
import BullQueueServices from '../services/BullQueueServicesZPRO';
import AppError from '../errors/AppErrorZPRO';
import { initializeQueuesAndProcesses } from '../server';

interface QueueRequest extends Request {
  user: {
    profile: string;
  };
  params: {
    queueName?: string;
  };
}

export const getQueueStats = async (req: QueueRequest, res: Response): Promise<void> => {
  if (req.user.profile !== 'superadmin') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  try {
    const stats = await BullQueueServices.getQueueStats();
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const reprocessFailedJobs = async (req: QueueRequest, res: Response): Promise<void> => {
  if (req.user.profile !== 'superadmin') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  try {
    const { queueName } = req.params;
    const result = await BullQueueServices.reprocessFailedJobs(queueName);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const restartProcessJobs = async (req: QueueRequest, res: Response): Promise<void> => {
  if (req.user.profile !== 'superadmin') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  try {
    await initializeQueuesAndProcesses();
    const result = BullQueueServices.restartProcessJobs();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 