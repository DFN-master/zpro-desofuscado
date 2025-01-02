import { Request, Response } from 'express';
import * as Yup from 'yup';
import { getIO } from '../libs/socketZPRO';
import ListPlansService from '../services/PlanService/ListPlansServiceZPRO';
import CreatePlansService from '../services/PlanService/CreatePlansServiceZPRO';
import ShowPlansService from '../services/PlanService/ShowPlansServiceZPRO';
import UpdatePlansService from '../services/PlanService/UpdatePlansServiceZPRO';
import DeletePlansService from '../services/PlanService/DeletePlansServiceZPRO';
import DeleteAllPlansService from '../services/PlanService/DeleteAllPlansServiceZPRO';
import AppError from '../errors/AppErrorZPRO';

interface PlanData {
  value: number;
  connections: number;
  users: number;
  userId: number;
  tenantId: number | string;
}

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query;

  const { plan, count, hasMore } = await ListPlansService({
    searchParam,
    pageNumber
  });

  return res.json({
    plan,
    count,
    hasMore
  });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  if (req.user.profile !== 'superadmin') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  const { tenantId, id } = req.user;
  const { value, connections, users } = req.body;

  const schema = Yup.object().shape({
    value: Yup.number().required(),
    connections: Yup.number().required(),
    userId: Yup.number().required(),
    users: Yup.number().required()
  });

  const planData: PlanData = {
    value,
    connections,
    users,
    userId: parseInt(id),
    tenantId
  };

  try {
    await schema.validate(planData);
  } catch (err) {
    throw new AppError(err.message);
  }

  const plan = await CreatePlansService(planData);

  return res.status(201).json(plan);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { planId } = req.params;
  const plan = await ShowPlansService(planId);

  return res.status(200).json(plan);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  if (req.user.profile !== 'superadmin') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  const { tenantId } = req.user;
  const planData = {
    ...req.body,
    userId: req.user.id,
    tenantId
  };

  const schema = Yup.object().shape({
    value: Yup.number().required(),
    connections: Yup.number().required(), 
    userId: Yup.number().required(),
    users: Yup.number().required()
  });

  try {
    await schema.validate(planData);
  } catch (err) {
    throw new AppError(err.message);
  }

  const { planId } = req.params;
  const plan = await UpdatePlansService({
    planData,
    planId
  });

  const io = getIO();
  io.emit('plan', {
    action: 'update',
    plan
  });

  return res.status(200).json(plan);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  if (req.user.profile !== 'superadmin') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  const { tenantId } = req.user;
  const { planId } = req.params;

  await DeletePlansService(planId, tenantId);

  const io = getIO();
  io.emit('plan', {
    action: 'delete',
    planId
  });

  return res.status(200).json({ message: 'Plan deleted' });
};

export const removeAll = async (req: Request, res: Response): Promise<Response> => {
  if (req.user.profile !== 'superadmin') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  const { tenantId } = req.user;
  await DeleteAllPlansService(tenantId);

  const io = getIO();
  io.emit('plan', {
    action: 'delete'
  });

  return res.status(200).json({ message: 'All Plans deleted' });
}; 