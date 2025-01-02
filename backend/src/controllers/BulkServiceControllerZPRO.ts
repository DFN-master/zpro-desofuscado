import { Request, Response } from 'express';
import { BulkFastMessageService } from '../services/BulkService/BulkFastMessageServiceZPRO';
import { BulkSendMessageService } from '../services/BulkService/BulkSendMessageServiceZPRO';
import { BulkSendMessageWithVariableService } from '../services/BulkService/BulkSendMessageWithVariableServiceZPRO';
import { IndividualService } from '../services/BulkService/IndividualServiceZPRO';
import { NoRedisService } from '../services/BulkService/NoRedisServiceZPRO';

export const bulkFastMessage = async (req: Request, res: Response): Promise<Response> => {
  try {
    await BulkFastMessageService(req);
    return res.status(200).json({
      message: "Bulk service started"
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
};

export const bulkSendMessage = async (req: Request, res: Response): Promise<Response> => {
  try {
    await BulkSendMessageService(req);
    return res.status(200).json({
      message: "Bulk service started"
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
};

export const bulkSendMessageWithVariable = async (req: Request, res: Response): Promise<Response> => {
  try {
    await BulkSendMessageWithVariableService(req);
    return res.status(200).json({
      message: "Send individual"
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
};

export const individual = async (req: Request, res: Response): Promise<Response> => {
  try {
    await IndividualService(req);
    return res.status(200).json({
      message: "Send individual message executed"
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
};

export const noRedis = async (req: Request, res: Response): Promise<Response> => {
  try {
    await NoRedisService(req);
    return res.status(200).json({
      message: "Send individual message executed"
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
};

export const sendButton = async (req: Request, res: Response): Promise<Response> => {
  return res.status(200).json({
    message: "Send individual message executed"
  });
}; 