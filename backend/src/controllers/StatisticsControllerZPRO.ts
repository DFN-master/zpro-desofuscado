import { Request, Response } from 'express';
import TicketsQueuesService from '../services/Statistics/TicketsQueuesServiceZPRO';
import ContactsReportService from '../services/Statistics/ContactsReportServiceZPRO';

interface User {
  tenantId: number;
  profile: string;
  id: number;
}

interface TicketQueryParams {
  dateStart: string;
  dateEnd: string;
  status: string;
  queuesIds: number[];
  showAll: boolean;
}

interface ContactQueryParams {
  startDate: string;
  endDate: string;
  tags: string[];
  wallets: string[];
  ddds: string[];
  kanban: boolean;
  searchParam: string;
}

export const DashTicketsQueues = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId, profile, id } = req.user as User;
  const { dateStart, dateEnd, status, queuesIds, showAll } = req.query as unknown as TicketQueryParams;

  const data = await TicketsQueuesService({
    showAll: profile === 'admin' ? showAll : false,
    dateStart,
    dateEnd,
    status,
    queuesIds,
    userId: id,
    tenantId
  });

  return res.status(200).json(data);
};

export const ContactsReport = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId, profile, id } = req.user as User;
  const {
    startDate,
    endDate,
    tags,
    wallets,
    ddds,
    kanban,
    searchParam
  } = req.query as unknown as ContactQueryParams;

  const data = await ContactsReportService({
    startDate,
    endDate,
    tags,
    wallets,
    ddds,
    kanban,
    tenantId,
    profile,
    userId: +id,
    searchParam
  });

  return res.status(200).json(data);
}; 