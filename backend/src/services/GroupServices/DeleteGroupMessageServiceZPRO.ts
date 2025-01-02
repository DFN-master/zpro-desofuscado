import AppError from "../../errors/AppErrorZPRO";
import GroupMessage from "../../models/GroupMessagesZPRO";

interface DeleteGroupMessageData {
  id: number;
  tenantId: number;
}

const DeleteGroupMessageService = async ({
  id,
  tenantId
}: DeleteGroupMessageData): Promise<void> => {
  const message = await GroupMessage.findOne({
    where: {
      tenantId,
      id
    }
  });

  if (!message) {
    throw new AppError("ERR_GROUP_NOT_FOUND", 404);
  }

  try {
    await message.destroy();
  } catch (err) {
    throw new AppError("ERR_GROUP_NOT_FOUND", 404);
  }
};

export default DeleteGroupMessageService; 