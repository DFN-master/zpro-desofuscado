import { BanList } from "../../models/BanList";
import AppError from "../../errors/AppError";

interface Request {
  tenantId: number;
}

const DeleteAllBanListsService = async ({ tenantId }: Request): Promise<void> => {
  const banLists = await BanList.findAll({
    where: { tenantId }
  });

  if (!banLists || banLists.length === 0) {
    throw new AppError("ERR_NO_BAN_LISTS_FOUND", 404);
  }

  // Remove todas as listas de banimento encontradas
  for (const banList of banLists) {
    await banList.destroy();
  }
};

export default DeleteAllBanListsService; 