import { Request, Response } from 'express';
import WhatsappZPRO from '../models/WhatsappZPRO';
import { logger } from '../utils/loggerZPRO';
import MeowMessageListener from '../services/WbotMeowServices/MeowMessageListenerZPRO';
import { fetchQrCode as fetchQRCodeMeow } from '../services/WbotMeowServices/FetchQRCodeMeowZPRO';

interface WebhookRequest extends Request {
  tenantId?: string | number;
  files?: any;
  user?: {
    tenantId: string | number;
  };
}

export const listen = async (req: WebhookRequest, res: Response): Promise<Response> => {
  logger.info(':::: Z-PRO :::: Meow Webhook received');

  const { wabaId } = req.params;
  const files = req.files;

  const whatsapp = await WhatsappZPRO.findOne({
    where: { wabaId }
  });

  if (!whatsapp) {
    return res.status(200).json({
      message: 'Whatsapp channel not found'
    });
  }

  if (whatsapp.status === 'DISCONNECTED') {
    return res.status(200).json({
      message: 'Whatsapp channel disconnected'
    });
  }

  try {
    await MeowMessageListener(req.body, whatsapp, files);
    return res.status(200).json({
      message: 'Webhook received'
    });
  } catch (error) {
    return res.status(500).json({
      message: error
    });
  }
};

export const fetchQrCode = async (req: WebhookRequest, res: Response): Promise<Response> => {
  logger.info(':::: Z-PRO :::: Meow Webhook received');

  const { tenantId } = req.user;
  const { wabaId } = req.params;

  const whatsapp = await WhatsappZPRO.findOne({
    where: { wabaId }
  });

  if (!whatsapp) {
    return res.status(200).json({
      message: 'Whatsapp channel not found'
    });
  }

  try {
    await fetchQRCodeMeow(tenantId, whatsapp);
    return res.status(200).json({
      message: 'Webhook received'
    });
  } catch (error) {
    return res.status(500).json({
      message: error
    });
  }
}; 