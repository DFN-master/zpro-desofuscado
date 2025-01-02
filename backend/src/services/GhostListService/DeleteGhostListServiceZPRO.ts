import { GhostListZPRO } from '../../models/GhostListZPRO';
import AppErrorZPRO from '../../errors/AppErrorZPRO';

interface DeleteGhostListRequest {
  id: number;
}

const DeleteGhostListService = async ({ id }: DeleteGhostListRequest): Promise<void> => {
  const ghostList = await GhostListZPRO.findOne({
    where: { id }
  });

  if (!ghostList) {
    throw new AppErrorZPRO('ERR_NO_GHOST_LIST_FOUND', 404);
  }

  await ghostList.destroy();
};

export default DeleteGhostListService; 