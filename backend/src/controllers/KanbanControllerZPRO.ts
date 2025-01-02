import { Request, Response } from 'express';
import * as Yup from 'yup';
import AppError from '../errors/AppErrorZPRO';

import CreateKanbanService from '../services/KanbanServices/CreateKanbanServiceZPRO';
import ListKanbanService from '../services/KanbanServices/ListKanbanServiceZPRO';
import UpdateKanbanService from '../services/KanbanServices/UpdateKanbanServiceZPRO';
import DeleteKanbanService from '../services/KanbanServices/DeleteKanbanServiceZPRO';

interface KanbanData {
  name: string;
  tenantId: number;
  userId?: number;
}

interface StoreRequest extends Request {
  body: KanbanData;
  user: {
    id: number;
    tenantId: number;
  };
}

interface UpdateRequest extends Request {
  body: KanbanData;
  params: {
    kanbanId: number;
  };
  user: {
    id: number;
    tenantId: number;
  };
}

interface DeleteRequest extends Request {
  params: {
    kanbanId: number;
  };
  user: {
    tenantId: number;
  };
}

export const store = async (req: StoreRequest, res: Response): Promise<Response> => {
  const { tenantId, id: userId } = req.user;
  
  const data = {
    ...req.body,
    userId,
    tenantId
  };

  const schema = Yup.object().shape({
    name: Yup.string().required(),
    tenantId: Yup.number().required()
  });

  try {
    await schema.validate(data);
  } catch (err) {
    throw new AppError(err.message);
  }

  const kanban = await CreateKanbanService(data);
  return res.status(200).json(kanban);
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const kanbans = await ListKanbanService({ tenantId });
  return res.status(200).json(kanbans);
};

export const update = async (req: UpdateRequest, res: Response): Promise<Response> => {
  const { tenantId, id: userId } = req.user;
  const { kanbanId } = req.params;

  const data = {
    ...req.body,
    userId,
    tenantId
  };

  const schema = Yup.object().shape({
    name: Yup.string().required(),
    tenantId: Yup.number().required()
  });

  try {
    await schema.validate(data);
  } catch (err) {
    throw new AppError(err.message);
  }

  const kanban = await UpdateKanbanService({
    kanbanData: data,
    kanbanId,
    tenantId
  });

  return res.status(200).json(kanban);
};

export const remove = async (req: DeleteRequest, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { kanbanId } = req.params;

  await DeleteKanbanService({
    kanbanId,
    tenantId
  });

  return res.status(200).json({ message: 'Kanban Config Deleted' });
}; 