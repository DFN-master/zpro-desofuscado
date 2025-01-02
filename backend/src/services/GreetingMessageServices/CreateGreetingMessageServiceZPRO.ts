import AppError from '../../errors/AppErrorZPRO';
import GreetingMessage from '../../models/GreetingMessageZPRO';

interface ICreateGreetingMessageRequest {
  groupId: string;
  message: string;
  userId: number;
  tenantId: number;
}

interface IGreetingMessage {
  id: number;
  groupId: string;
  message: string;
  userId: number;
  tenantId: number;
  createdAt: Date;
  updatedAt: Date;
}

const CreateGreetingMessageService = async ({
  groupId,
  message,
  userId,
  tenantId
}: ICreateGreetingMessageRequest): Promise<IGreetingMessage> => {
  // Verifica se já existe uma mensagem de saudação para este grupo
  const greetingMessageExists = await GreetingMessage.findOne({
    where: {
      groupId,
      message,
      userId,
      tenantId
    }
  });

  if (greetingMessageExists) {
    throw new AppError('ERR_GREETING_MESSAGE_DUPLICATE');
  }

  // Cria uma nova mensagem de saudação
  const greetingMessage = await GreetingMessage.create({
    groupId,
    message,
    userId,
    tenantId
  });

  return greetingMessage;
};

export default CreateGreetingMessageService; 