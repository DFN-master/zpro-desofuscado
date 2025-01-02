import * as Yup from 'yup';
import { Request, Response } from 'express';
import AppError from '../errors/AppErrorZPRO';
import CreateTicketProtocolService from '../services/TicketProtocol/CreateTicketProtocolServiceZPRO';
import ListTicketProtocolService from '../services/TicketProtocol/ListTicketProtocolServiceZPRO';
import DeleteTicketProtocolService from '../services/TicketProtocol/DeleteTicketProtocolServiceZPRO';
import UpdateTicketProtocolService from '../services/TicketProtocol/UpdateTicketProtocolServiceZPRO';
import ShowLogProtocolTicketService from '../services/TicketProtocol/ShowLogProtocolTicketServiceZPRO';

interface TicketProtocolData {
  protocol: string;
  ticketId: number;
  userId: number;
  tenantId: number;
}

interface UpdateTicketProtocolData {
  ticketProtocolData: TicketProtocolData;
  ticketProtocolId: number;
}

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  
  const data: TicketProtocolData = {
    ...req.body,
    userId: req.user.id,
    tenantId
  };

  const schema = Yup.object().shape({
    protocol: Yup.string().required(),
    ticketId: Yup.number().required(),
    userId: Yup.number().required(),
    tenantId: Yup.number().required()
  });

  try {
    await schema.validate(data);
  } catch (err) {
    throw new AppError(err.message);
  }

  const ticketProtocol = await CreateTicketProtocolService(data);
  return res.status(200).json(ticketProtocol);
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const ticketProtocols = await ListTicketProtocolService({ tenantId });
  return res.status(200).json(ticketProtocols);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  
  const data: TicketProtocolData = {
    ...req.body,
    userId: req.user.id,
    tenantId
  };

  const schema = Yup.object().shape({
    protocol: Yup.string().required(),
    ticketId: Yup.number().required(),
    userId: Yup.number().required()
  });

  try {
    await schema.validate(data);
  } catch (err) {
    throw new AppError(err.message);
  }

  const { ticketProtocolId } = req.params;

  const updateData: UpdateTicketProtocolData = {
    ticketProtocolData: data,
    ticketProtocolId: Number(ticketProtocolId)
  };

  const ticketProtocol = await UpdateTicketProtocolService(updateData);
  return res.status(200).json(ticketProtocol);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { ticketProtocolId } = req.params;

  await DeleteTicketProtocolService({
    id: Number(ticketProtocolId),
    tenantId
  });

  return res.status(200).json({ message: 'Ticket protocol deleted' });
};

export const showLogsProtocol = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const logs = await ShowLogProtocolTicketService({ ticketId: Number(ticketId) });
  return res.status(200).json(logs);
}; 