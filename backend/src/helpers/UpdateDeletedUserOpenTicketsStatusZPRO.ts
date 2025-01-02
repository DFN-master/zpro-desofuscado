interface TicketData {
  status: string;
  tenantId: string;
}

interface UpdateTicketParams {
  ticketData: TicketData;
  ticketId: string;
  userIdRequest: string;
}

import UpdateTicketServiceZPRO from '../services/TicketService/UpdateTicketServiceZPRO';

const UpdateDeletedUserOpenTicketsStatus = async (
  tickets: any[],
  tenantId: string,
  userIdRequest: string
): Promise<void> => {
  tickets.forEach(async (ticket) => {
    const ticketId = ticket.id.toString();
    
    const ticketData: TicketData = {
      status: "pending",
      tenantId
    };

    const params: UpdateTicketParams = {
      ticketData,
      ticketId,
      userIdRequest
    };

    await UpdateTicketServiceZPRO(params);
  });
};

export default UpdateDeletedUserOpenTicketsStatus; 