import { Op } from 'sequelize';
import Message from '../../models/MessageZPRO';
import Contact from '../../models/ContactZPRO';
import Ticket from '../../models/TicketZPRO';

interface ListScheduleMessagesParams {
  tenantId: number | string;
}

interface ScheduleMessageResponse {
  messages: Message[];
}

const ListScheduleMessagesService = async ({
  tenantId
}: ListScheduleMessagesParams): Promise<ScheduleMessageResponse> => {
  const scheduleDate = { [Op.ne]: null };

  const messages = await Message.findAll({
    where: {
      tenantId,
      scheduleDate
    },
    include: [
      {
        model: Contact,
        as: 'contact'
      },
      {
        model: Ticket
      }
    ]
  });

  return {
    messages: messages.reverse()
  };
};

export default ListScheduleMessagesService; 