import { GreetingMessage } from "../../models/GreetingMessageZPRO";
import AppError from "../../errors/AppError";

interface UpdateGreetingMessageData {
  groupId: string;
  message: string;
  userId: number;
  tenantId: number;
}

interface Request {
  greetingMessageData: UpdateGreetingMessageData;
  greetingMessageId: number;
}

const UpdateGreetingMessageService = async ({
  greetingMessageData,
  greetingMessageId
}: Request): Promise<GreetingMessage> => {
  const { groupId, message, userId, tenantId } = greetingMessageData;

  // Busca a mensagem de saudação existente
  const greetingMessage = await GreetingMessage.findOne({
    where: {
      id: greetingMessageId,
      tenantId
    },
    attributes: ["id", "groupId", "message", "userId"]
  });

  // Verifica se a mensagem existe
  if (!greetingMessage) {
    throw new AppError("ERR_NO_GREETING_MESSAGE_FOUND", 404);
  }

  // Atualiza os dados da mensagem
  await greetingMessage.update({
    groupId,
    message, 
    userId
  });

  // Recarrega os dados atualizados
  await greetingMessage.reload({
    attributes: ["id", "groupId", "message", "userId"]
  });

  return greetingMessage;
};

export default UpdateGreetingMessageService; 