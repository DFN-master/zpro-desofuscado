import { Request, Response } from 'express';
import * as Yup from 'yup';
import AppError from '../errors/AppErrorZPRO';
import { logger } from '../utils/loggerZPRO';
import socketEmit from '../helpers/socketEmitZPRO';

import CreateTicketNotesService from '../services/TicketNotes/CreateTicketNotesServiceZPRO';
import ListTicketNotesService from '../services/TicketNotes/ListTicketNotesServiceZPRO';
import DeleteTicketNotesService from '../services/TicketNotes/DeleteTicketNotesServiceZPRO';
import UpdateTicketNotesService from '../services/TicketNotes/UpdateTicketNotesServiceZPRO';
import ShowLogNotesTicketService from '../services/TicketNotes/ShowLogNotesTicketServiceZPRO';
import ShowTicketService from '../services/TicketService/ShowTicketServiceZPRO';
import CreateMessageSystemService from '../services/MessageSystem/CreateMessageSystemServiceZPRO';
import DeleteMessageSystem from '../helpers/DeleteMessageSystemZPRO';
import Message from '../models/MessageZPRO';
import TicketNotes from '../models/TicketNotes';

interface StoreData {
  notes: string;
  ticketId: number;
  userId: number;
  tenantId: number;
  idFront?: string;
}

interface UpdateData {
  notes: string;
  ticketId: number;
  userId: number;
  tenantId: number;
  ticketNotesId: number;
}

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  
  const data: StoreData = {
    ...req.body,
    userId: req.user.id,
    tenantId
  };

  const schema = Yup.object().shape({
    notes: Yup.string().required(),
    ticketId: Yup.number().required(),
    userId: Yup.number().required(),
    tenantId: Yup.number().required()
  });

  try {
    await schema.validate(data);
  } catch (err) {
    throw new AppError(err.message);
  }

  const ticket = await ShowTicketService({ 
    id: req.body.ticketId,
    tenantId 
  });

  try {
    if (ticket) {
      await CreateMessageSystemService({
        msg: {
          message: req.body.notes,
          fromMe: true,
          read: true
        },
        tenantId,
        ticket,
        userId: req.user.id,
        type: "notes",
        status: "sended",
        idFront: req.body.idFront
      });
    }
  } catch (err) {
    logger.info(":::: Z-PRO :::: try Create Message System Service", err);
  }

  const ticketNotes = await CreateTicketNotesService(data);
  return res.status(200).json(ticketNotes);
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const ticketNotes = await ListTicketNotesService({ tenantId });
  return res.status(200).json(ticketNotes);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  
  const data: UpdateData = {
    ...req.body,
    userId: req.user.id,
    tenantId
  };

  const schema = Yup.object().shape({
    notes: Yup.string().required(),
    ticketId: Yup.number().required(), 
    userId: Yup.number().required()
  });

  try {
    await schema.validate(data);
  } catch (err) {
    throw new AppError(err.message);
  }

  try {
    const message = await Message.findOne({
      where: {
        idFront: req.body.idFront,
        tenantId
      }
    });

    if (message) {
      await message.update({
        message: req.body.notes
      });

      socketEmit({
        tenantId,
        type: "chat:update",
        payload: message
      });
    }
  } catch (err) {
    console.log(err);
  }

  const { ticketNotesId } = req.params;

  const ticketNotes = await UpdateTicketNotesService({
    ticketNotesData: data,
    ticketNotesId
  });

  return res.status(200).json(ticketNotes);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { ticketNotesId } = req.params;

  try {
    const ticketNote = await TicketNotes.findOne({
      where: { 
        id: ticketNotesId,
        tenantId
      }
    });

    if (ticketNote) {
      const message = await Message.findOne({
        where: {
          idFront: ticketNote.idFront,
          tenantId  
        }
      });

      if (message) {
        await DeleteMessageSystem(message.id, message.fromMe, tenantId);
        
        const messageDeleted = await Message.findByPk(message.id);
        if (messageDeleted) {
          socketEmit({
            tenantId,
            type: "chat:delete",
            payload: messageDeleted
          });
        }
      }
    }
  } catch (err) {
    console.log(err);
  }

  await DeleteTicketNotesService({
    id: ticketNotesId,
    tenantId
  });

  return res.status(200).json({ message: "Ticket notes deleted" });
};

export const showLogsNotes = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const logs = await ShowLogNotesTicketService({ ticketId });
  return res.status(200).json(logs);
}; 