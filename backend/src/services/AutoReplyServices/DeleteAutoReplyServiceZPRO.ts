import { Request } from 'express';
import AppError from '../../errors/AppErrorZPRO';
import AutoReply from '../../models/AutoReplyZPRO';
import Ticket from '../../models/TicketZPRO';

interface DeleteAutoReplyData {
  id: number;
  tenantId: number;
}

const DeleteAutoReplyService = async ({
  id,
  tenantId
}: DeleteAutoReplyData): Promise<void> => {
  const autoReply = await AutoReply.findOne({
    where: {
      id,
      tenantId
    }
  });

  const ticket = await Ticket.findOne({
    where: {
      autoReplyId: id
    }
  });

  if (ticket) {
    throw new AppError(
      "ERR_AUTO_REPLY_RELATED_TICKET",
      404
    );
  }

  if (!autoReply) {
    throw new AppError(
      "ERR_NO_AUTO_REPLY_FOUND",
      404
    );
  }

  await autoReply.destroy();
};

export default DeleteAutoReplyService; 