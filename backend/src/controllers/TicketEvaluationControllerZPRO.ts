import * as Yup from 'yup';
import { Request, Response } from 'express';
import AppErrorZPRO from '../errors/AppErrorZPRO';
import CreateTicketEvaluationServiceZPRO from '../services/TicketEvaluations/CreateTicketEvaluationServiceZPRO';
import ListTicketEvaluationServiceZPRO from '../services/TicketEvaluations/ListTicketEvaluationServiceZPRO';
import DeleteTicketEvaluationServiceZPRO from '../services/TicketEvaluations/DeleteTicketEvaluationServiceZPRO';
import UpdateTicketEvaluationServiceZPRO from '../services/TicketEvaluations/UpdateTicketEvaluationServiceZPRO';
import ShowLogEvaluationTicketServiceZPRO from '../services/TicketEvaluations/ShowLogEvaluationTicketServiceZPRO';

interface TicketEvaluationData {
  evaluation: string;
  attempts: number;
  ticketId: number;
  userId: number;
  tenantId: number;
}

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    tenantId: number;
  }
}

export const store = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  const data: TicketEvaluationData = {
    ...req.body,
    userId: req.user.id,
    tenantId
  };

  const schema = Yup.object().shape({
    evaluation: Yup.string().required(),
    attempts: Yup.number().required(),
    ticketId: Yup.number().required(),
    userId: Yup.number().required(),
    tenantId: Yup.number().required()
  });

  try {
    await schema.validate(data);
  } catch (err) {
    throw new AppErrorZPRO(err.message);
  }

  const ticketEvaluation = await CreateTicketEvaluationServiceZPRO(data);
  return res.status(200).json(ticketEvaluation);
};

export const index = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const ticketEvaluations = await ListTicketEvaluationServiceZPRO({ tenantId });
  return res.status(200).json(ticketEvaluations);
};

export const update = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  const data: TicketEvaluationData = {
    ...req.body,
    userId: req.user.id,
    tenantId
  };

  const schema = Yup.object().shape({
    evaluation: Yup.string().required(),
    attempts: Yup.number().required(), 
    ticketId: Yup.number().required(),
    userId: Yup.number().required()
  });

  try {
    await schema.validate(data);
  } catch (err) {
    throw new AppErrorZPRO(err.message);
  }

  const { ticketEvaluationId } = req.params;

  const ticketEvaluation = await UpdateTicketEvaluationServiceZPRO({
    ticketEvaluationData: data,
    ticketEvaluationId
  });

  return res.status(200).json(ticketEvaluation);
};

export const remove = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { ticketEvaluationId } = req.params;

  await DeleteTicketEvaluationServiceZPRO({
    id: ticketEvaluationId,
    tenantId
  });

  return res.status(200).json({ message: "Ticket evaluation deleted" });
};

export const showLogsEvaluation = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  
  const logs = await ShowLogEvaluationTicketServiceZPRO({
    ticketId
  });

  return res.status(200).json(logs);
}; 