import { GhostListZPRO } from "../../models/GhostListZPRO";
import AppErrorZPRO from "../../errors/AppErrorZPRO";

interface Request {
  id: number;
}

const ShowGhostListService = async ({ id }: Request): Promise<GhostListZPRO> => {
  const ghostList = await GhostListZPRO.findByPk(id);

  if (!ghostList) {
    throw new AppErrorZPRO("ERR_NO_GHOST_LIST_FOUND", 404);
  }

  return ghostList;
};

export default ShowGhostListService; 