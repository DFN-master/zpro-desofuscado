import { Op } from 'sequelize';
import AppError from '../errors/AppErrorZPRO';
import Ticket from '../models/TicketZPRO';

interface TicketStatus {
  status: 'open' | 'pending';
}

const CheckContactOpenTickets = async (
  contactId: number,
  whatsappId: number
): Promise<void> => {
  const ticketStatus: TicketStatus = {
    status: 'open' || 'pending'
  };

  const whereCondition = {
    [Op.or]: [ticketStatus.status, 'pending']
  };

  const searchParams = {
    where: {
      contactId,
      whatsappId,
      status: whereCondition
    }
  };

  const ticket = await Ticket.findOne(searchParams);

  if (ticket) {
    throw new AppError(JSON.stringify(ticket), 400);
  }
};

export default CheckContactOpenTickets; 