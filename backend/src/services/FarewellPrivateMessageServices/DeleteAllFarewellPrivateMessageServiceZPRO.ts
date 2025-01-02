import { Op } from "sequelize";
import FarewellPrivateMessageZPRO from "../../models/FarewellPrivateMessageZPRO";
import AppErrorZPRO from "../../errors/AppErrorZPRO";

interface Request {
  tenantId: number;
}

const DeleteAllFarewellPrivateMessagesService = async ({
  tenantId
}: Request): Promise<void> => {
  const messages = await FarewellPrivateMessageZPRO.findAll({
    where: {
      tenantId
    }
  });

  if (!messages || messages.length === 0) {
    throw new AppErrorZPRO(
      "ERR_NO_FAREWELL_PRIVATE_MESSAGES_FOUND",
      404
    );
  }

  // Delete all found messages
  for (const message of messages) {
    await message.destroy();
  }
};

export default DeleteAllFarewellPrivateMessagesService; 