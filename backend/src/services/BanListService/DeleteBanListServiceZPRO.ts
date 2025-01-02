import { BanList } from "../../models/BanListZPRO";
import AppError from "../../errors/AppErrorZPRO";

interface Request {
  id: string;
  tenantId: string | number;
}

const DeleteBanListService = async ({ id, tenantId }: Request): Promise<void> => {
  const banList = await BanList.findOne({
    where: {
      id,
      tenantId
    }
  });

  if (!banList) {
    throw new AppError("ERR_NO_BAN_LIST_FOUND", 404);
  }

  await banList.destroy();
};

export default DeleteBanListService; 