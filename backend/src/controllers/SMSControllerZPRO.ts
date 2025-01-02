import { Request, Response } from 'express';
import axios from 'axios';
import Tenant from '../models/TenantZPRO';

interface SMSRequest {
  phoneNumber: string;
  message: string;
}

interface BulkSMSRequest {
  arrayNumbers: string[];
  message: string;
  min: string;
  max: string;
  importContact: boolean;
}

interface RequestWithUser extends Request {
  user: {
    tenantId: string;
  };
}

export const sendSMS = async (req: RequestWithUser, res: Response): Promise<Response> => {
  try {
    const { tenantId } = req.user;
    const { phoneNumber, message } = req.body as SMSRequest;

    const tenant = await Tenant.findOne({
      where: { id: tenantId }
    });

    const headers = {
      'Content-Type': 'application/json',
      'auth-key': tenant?.smsToken
    };

    const payload = {
      Receivers: phoneNumber,
      Content: message
    };

    const response = await axios.post(
      'https://sms.comtele.com.br/api/v2/send',
      payload,
      { headers }
    );

    return res.status(response.status).json(response.data);
  } catch (error) {
    return res.status(400).json({
      error: 'Erro ao enviar SMS'
    });
  }
};

export const bulkSMS = async (req: RequestWithUser, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { arrayNumbers, message, min, max, importContact } = req.body as BulkSMSRequest;

  const tenant = await Tenant.findOne({
    where: { id: tenantId }
  });

  const headers = {
    'Content-Type': 'application/json',
    'auth-key': tenant?.smsToken
  };

  const processNumber = (number: string): string => {
    if (number.startsWith('55') && number.slice(-8).length === 8) {
      return number.slice(0, -8) + '9' + number.slice(-8);
    }
    return number;
  };

  const sendMessage = async (phoneNumber: string): Promise<void> => {
    const delay = Math.floor(
      Math.random() * (parseInt(max, 10) - parseInt(min, 10) + 1) + parseInt(min, 10)
    );

    const payload = {
      Receivers: phoneNumber,
      Content: message
    };

    try {
      await axios.post('https://sms.comtele.com.br/api/v2/send', payload, { headers });
    } catch (error) {
      // Silently handle individual message errors
    }

    await new Promise(resolve => setTimeout(resolve, delay));
  };

  // Process numbers based on importContact flag
  for (const number of arrayNumbers) {
    const processedNumber = processNumber(number);
    await sendMessage(processedNumber);
  }

  return res.status(200).json({
    message: 'Bulk service started'
  });
}; 