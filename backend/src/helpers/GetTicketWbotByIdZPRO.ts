import { WASocket } from '@whiskeysockets/baileys';
import { getWbot } from '../libs/wbotZPRO';
import AppError from '../errors/AppError';

interface WbotReturn extends WASocket {
  id?: string | number;
  profilePictureUrl?: (jid: string) => Promise<string>;
  sendMessage?: (
    jid: string,
    content: any,
    options?: any
  ) => Promise<any>;
  user?: {
    id: string;
    name: string;
  };
  ws?: any;
  ev?: any;
  query?: any;
  type?: string;
  isOnline?: boolean;
  isChannel?: boolean;
  lastSeen?: Date;
  presence?: {
    status: string;
    lastSeen: Date;
  };
}

const GetTicketWbotById = async (wbotId: string | number): Promise<WbotReturn> => {
  try {
    const wbot = getWbot(wbotId);

    if (!wbot) {
      throw new AppError('ERR_WBOT_NOT_FOUND', 404);
    }

    return wbot;
  } catch (err) {
    throw new AppError(
      'ERR_WBOT_REQ_FAILED',
      500,
      'Failed to get WhatsApp connection'
    );
  }
};

export default GetTicketWbotById; 