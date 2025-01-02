import { BanList } from "../../models/BanList";
import AppError from "../../errors/AppError";

interface Request {
  id: number;
}

const ShowBanListService = async ({ id }: Request): Promise<BanList> => {
  const banList = await BanList.findByPk(id);

  if (!banList) {
    throw new AppError("ERR_NO_BAN_LIST_FOUND", 404);
  }

  return banList;
};

export default ShowBanListService; 