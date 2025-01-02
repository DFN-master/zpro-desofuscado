import { Request, Response } from 'express';
import AppErrorZPRO from '../errors/AppErrorZPRO';
import MessengerConsumerZPRO from '../services/MessengerConsumerZPRO';
import { logger } from '../utils/loggerZPRO';

interface IMessageRequest {
  token: string;
  messages: any;
}

export const ReceivedRequest360 = async (
  request: Request,
  response: Response
): Promise<Response> => {
  const queueName = 'waba360';
  const successMessage = 'Z-PRO WEBHOOK_VERIFIED';

  try {
    const messageData: IMessageRequest = {
      token: request.params.token,
      messages: request.body
    };

    await request.app.rabbit.publishInQueue(
      queueName,
      JSON.stringify(messageData)
    );
  } catch (error) {
    throw new AppErrorZPRO(error.message);
  }

  return response.status(200).json({ message: successMessage });
};

export const CheckServiceMessenger = async (
  request: Request,
  response: Response
): Promise<Response> => {
  const CHALLENGE_PARAM = 'hub.challenge';
  const LOG_MESSAGE = ':::: ZDG :::: Z-PRO :: WEBHOOK_VERIFIED';
  
  const challenge = request.query[CHALLENGE_PARAM];
  
  logger.warn(LOG_MESSAGE);
  
  return response.status(200).send(challenge);
};

export const ReceivedRequestMessenger = async (
  request: Request,
  response: Response
): Promise<Response> => {
  const successMessage = 'Z-PRO WEBHOOK_VERIFIED';

  try {
    const messageData: IMessageRequest = {
      token: request.params.token,
      messages: request.body
    };

    MessengerConsumerZPRO(messageData);
  } catch (error) {
    throw new AppErrorZPRO(error.message);
  }

  return response.status(200).json({ message: successMessage });
}; 