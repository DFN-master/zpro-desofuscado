import { Request } from 'express';
import AppError from '../../errors/AppErrorZPRO';
import GreetingMessage from '../../models/GreetingMessageZPRO';

interface DeleteGreetingMessageData {
  id: number;
  tenantId: number;
}

const DeleteGreetingMessageService = async ({
  id,
  tenantId
}: DeleteGreetingMessageData): Promise<void> => {
  const greetingMessage = await GreetingMessage.findOne({
    where: {
      id,
      tenantId
    }
  });

  if (!greetingMessage) {
    throw new AppError('ERR_NO_GREETING_MESSAGE_FOUND', 404);
  }

  await greetingMessage.destroy();
};

export default DeleteGreetingMessageService; 