import FarewellMessageZPRO from "../../models/FarewellMessageZPRO";
import AppErrorZPRO from "../../errors/AppErrorZPRO";

interface Request {
  tenantId: number;
}

const DeleteAllFarewellMessagesService = async ({ tenantId }: Request): Promise<void> => {
  const messages = await FarewellMessageZPRO.findAll({
    where: {
      tenantId
    }
  });

  if (!messages || messages.length === 0) {
    throw new AppErrorZPRO("ERR_NO_FAREWELL_MESSAGES_FOUND", 404);
  }

  // Deleta todas as mensagens encontradas
  for (const message of messages) {
    await message.destroy();
  }
};

export default DeleteAllFarewellMessagesService; 