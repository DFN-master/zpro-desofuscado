import FarewellPrivateMessageZPRO from "../../models/FarewellPrivateMessageZPRO";
import AppErrorZPRO from "../../errors/AppErrorZPRO";

interface DeleteRequest {
  id: number;
  tenantId: number;
}

const DeleteFarewellPrivateMessageService = async ({
  id,
  tenantId
}: DeleteRequest): Promise<void> => {
  const message = await FarewellPrivateMessageZPRO.findOne({
    where: {
      id,
      tenantId
    }
  });

  if (!message) {
    throw new AppErrorZPRO("ERR_NO_FAREWELL_PRIVATE_MESSAGE_FOUND", 404);
  }

  await message.destroy();
};

export default DeleteFarewellPrivateMessageService; 