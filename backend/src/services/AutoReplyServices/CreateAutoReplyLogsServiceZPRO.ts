import AutoReplyLogsZPRO from '../../models/AutoReplyLogsZPRO';

interface IAutoReply {
  id: number;
  autoReply: string;
  name: string;
}

interface ITicket {
  id: number;
  reply: string;
}

interface ICreateAutoReplyLog {
  idAutoReplyId: number;
  autoReplyName: string;
  stepsReplyId: number; 
  stepsReplyMessage: string;
  wordsReply: string;
  ticketId: number;
  contactId: number;
}

const CreateAutoReplyLogService = async (
  autoReply: IAutoReply,
  ticket: ITicket,
  wordsReply: string
): Promise<AutoReplyLogsZPRO> => {
  const autoReplyLogData: ICreateAutoReplyLog = {
    idAutoReplyId: autoReply.autoReply,
    autoReplyName: autoReply.name,
    stepsReplyId: autoReply.id,
    stepsReplyMessage: autoReply.name,
    wordsReply,
    ticketId: ticket.id,
    contactId: ticket.reply
  };

  const autoReplyLog = await AutoReplyLogsZPRO.create(autoReplyLogData);
  
  return autoReplyLog;
};

export default CreateAutoReplyLogService; 