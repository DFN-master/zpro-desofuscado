import fs from 'fs';
import { logger } from '../utils/loggerZPRO';
import { getWbot } from '../libs/wbotZPRO';
import VerifyContactZPRO from '../services/helpers/VerifyContactZPRO';
import FindOrCreateTicketServiceZPRO from '../services/TicketServices/FindOrCreateTicketServiceZPRO';
import CreateMessageSystemServiceZPRO from '../services/MessageServices/CreateMessageSystemServiceZPRO';
import QueueZPRO_Dig from '../libs/QueueZPRO_Dig';

interface MessageData {
  sessionId: string;
  number: string;
  body: string;
  media?: {
    path: string;
  };
  apiConfig?: {
    externalKey?: string;
    webhookMessage?: string;
  };
  tenantId: number;
  status?: string;
  messageId?: string;
  authToken?: string;
  type?: string;
  urlMessage?: string;
}

interface JobResponse {
  status: number;
  messageId: string;
  message: string;
  number: string;
  externalKey: string;
  error: string;
  type: string;
  tenantId: number;
}

const jobConfig = {
  key: 'SendMessage-WebHooksAPI',
  options: {
    delay: 6000,
    attempts: 50,
    removeOnComplete: true,
    removeOnFail: false,
    backoff: {
      type: 'fixed',
      delay: 60000 * 5
    }
  },
  
  async handle({ data }: { data: MessageData }): Promise<JobResponse> {
    try {
      const wbot = getWbot(data.sessionId);
      
      try {
        const numberId = await wbot.getNumberId(data.number);
        
        if (!numberId) {
          const response: JobResponse = {
            status: -1,
            messageId: data.messageId,
            message: '',
            number: data.number,
            externalKey: data.apiConfig?.externalKey,
            error: 'number invalid in whatsapp',
            type: 'error session',
            tenantId: data.tenantId
          };

          if (data.media?.path) {
            fs.unlinkSync(data.media.path);
          }

          if (data.apiConfig?.webhookMessage) {
            QueueZPRO_Dig.default.add(
              `${wbot.id}-WebHooksAPI`,
              {
                webhook: data.apiConfig.webhookMessage,
                type: response.type,
                payload: response
              }
            );
          }

          return response;
        }

        const contact = await wbot.getContactById(numberId.user);
        const verifiedContact = await VerifyContactZPRO(contact, data.tenantId);
        
        const ticket = await FindOrCreateTicketServiceZPRO({
          contact: verifiedContact,
          whatsappId: wbot.id,
          unreadMessages: 0,
          tenantId: data.tenantId,
          groupContact: undefined,
          apiConfig: data,
          channel: "whatsapp"
        });

        await CreateMessageSystemServiceZPRO({
          apiConfig: data,
          tenantId: data.tenantId,
          ticket: ticket,
          type: "hookMessage",
          sendType: "API"
        });

        await ticket.update({
          apiConfig: {
            ...data.apiConfig,
            externalKey: data.apiConfig?.externalKey
          }
        });

      } catch (err) {
        const response: JobResponse = {
          status: -1,
          messageId: data.messageId,
          message: '',
          number: data.number,
          externalKey: data.apiConfig?.externalKey,
          error: 'Error sending message api',
          type: 'error session',
          tenantId: data.tenantId
        };

        if (data.apiConfig?.webhookMessage) {
          QueueZPRO_Dig.default.add(
            `${wbot.id}-WebHooksAPI`,
            {
              webhook: data.apiConfig.webhookMessage,
              type: response.type,
              payload: response
            }
          );
        }

        throw new Error(err);
      }

    } catch (err) {
      logger.error({
        error: 'Error send message api',
        message: err
      });
      throw new Error(err);
    }
  }
};

export default jobConfig; 