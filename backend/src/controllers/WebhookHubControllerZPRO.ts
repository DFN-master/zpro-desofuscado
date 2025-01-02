import { Request, Response } from 'express';
import Whatsapp from '../models/WhatsappZPRO';
import HubMessageListener from '../services/HubMessageListenerZPRO';
import { logger } from '../utils/loggerZPRO';

interface WebhookRequest extends Request {
  body: {
    wabaId: string;
    files?: any;
  };
  params: any;
}

const listen = async (req: WebhookRequest, res: Response): Promise<Response> => {
  const messages = {
    receivedMessage: '::: ZDG ::: Z-PRO ::: Hub Webhook received',
    channelNotFound: 'Whatsapp channel not found',
    success: '::: ZDG ::: Webhook received'
  };

  logger.info(messages.receivedMessage);

  const { wabaId } = req.params;
  
  const whatsapp = await Whatsapp.findOne({
    where: { wabaId }
  });

  if (!whatsapp) {
    return res.status(400).json({ message: messages.channelNotFound });
  }

  const files = req.files;

  try {
    await HubMessageListener(req.body, whatsapp, files);
    return res.status(200).json({ message: messages.success });
  } catch (error) {
    return res.status(500).json({ message: error });
  }
};

export { listen }; 