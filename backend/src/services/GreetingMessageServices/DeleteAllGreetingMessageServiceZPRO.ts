import { Op } from "sequelize";
import AppError from "../../errors/AppErrorZPRO";
import GreetingMessage from "../../models/GreetingMessageZPRO";

interface Request {
  tenantId: number;
}

const DeleteAllGreetingMessagesService = async ({
  tenantId
}: Request): Promise<void> => {
  const greetingMessages = await GreetingMessage.findAll({
    where: {
      tenantId
    }
  });

  if (!greetingMessages || greetingMessages.length === 0) {
    throw new AppError("ERR_NO_GREETING_MESSAGES_FOUND", 404);
  }

  // Deletar todas as mensagens de saudação encontradas
  for (const message of greetingMessages) {
    await message.destroy();
  }
};

export default DeleteAllGreetingMessagesService; 