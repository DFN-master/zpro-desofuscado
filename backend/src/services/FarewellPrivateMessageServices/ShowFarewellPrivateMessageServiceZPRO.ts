import { FarewellPrivateMessageZPRO } from "../../models/FarewellPrivateMessageZPRO";
import AppErrorZPRO from "../../errors/AppErrorZPRO";

interface Request {
  id: number;
}

const ShowFarewellPrivateMessageService = async ({ id }: Request): Promise<FarewellPrivateMessageZPRO> => {
  const farewellMessage = await FarewellPrivateMessageZPRO.findByPk(id);

  if (!farewellMessage) {
    throw new AppErrorZPRO("ERR_NO_FAREWELL_PRIVATE_MESSAGE_FOUND", 404);
  }

  return farewellMessage;
};

export default ShowFarewellPrivateMessageService; 