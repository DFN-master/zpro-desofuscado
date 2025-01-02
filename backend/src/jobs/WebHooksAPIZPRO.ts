import axios from 'axios';
import { logger } from '../utils/loggerZPRO';

interface WebhookConfig {
  delay: number;
  attempts: number;
  backoff: {
    type: string;
    delay: number;
  };
}

interface WebhookData {
  type: string;
  url: string;
  payload: any;
  authToken?: string;
}

interface WebhookMessageData {
  messageId: string;
  ticketId: number;
  externalKey?: string;
  type: string;
}

interface WebhookSessionData {
  number: string;
  status: string;
  qrcode: string;
  timestamp: string;
  type: string;
}

interface WebhookStatusData {
  ack: number;
  status: string;
  externalKey?: string;
  type: string;
}

const defaultOptions: WebhookConfig = {
  delay: 6000,
  attempts: 50,
  backoff: {
    type: 'fixed',
    delay: 60000 * 3 // 3 minutos
  }
};

export default {
  key: (webhookId: string) => `${webhookId}-WebHooksAPI`,
  options: defaultOptions,
  
  async handle({ data }: { data: WebhookData }): Promise<any> {
    try {
      if (!data?.url) {
        return { 
          message: 'Queue WebHook não existe.' 
        };
      }

      let webhookPayload: WebhookMessageData | WebhookSessionData | WebhookStatusData;

      if (data.type === 'hookSession') {
        webhookPayload = {
          number: data.payload.number,
          timestamp: data.payload.timestamp,
          externalKey: data.payload.externalKey,
          type: data.type
        };
      }

      if (data.type === 'hookMessage') {
        webhookPayload = {
          messageId: data.payload.messageId,
          message: data.payload.msg,
          timestamp: data.payload.timestamp,
          ack: data.payload.ack,
          externalKey: data.payload.externalKey,
          type: data.type
        };
      }

      if (data.type === 'hookStatus') {
        webhookPayload = {
          status: data.payload.status,
          fixed: data.payload.fixed,
          nStatus: data.payload.nStatus,
          messageId: data.payload.messageId,
          number: data.payload.number,
          type: data.type
        };
      }

      if (data.payload.authToken) {
        await axios.post(data.url, webhookPayload, {
          headers: {
            authorization: data.payload.authToken
          }
        });
      } else {
        await axios.post(data.url, webhookPayload);
      }

      logger.info(
        `::: Z-PRO ::: Queue WebHooksAPI success: Data: ${data} Payload: ${webhookPayload}`
      );

      return {
        response: data,
        data: webhookPayload
      };

    } catch (error: any) {
      logger.warn(
        `::: ZDG ::: Error send message: Error ao configurar no webhook: ${error}`
      );

      if (error?.response?.status === 404) {
        return {
          message: 'Queue WebHook não existe.'
        };
      }

      throw new Error(error);
    }
  }
}; 