import { GhostListZPRO } from '../../models/GhostListZPRO';
import AppErrorZPRO from '../../errors/AppErrorZPRO';

const DeleteAllGhostListsService = async (): Promise<void> => {
  const ghostLists = await GhostListZPRO.findAll();

  if (!ghostLists || ghostLists.length === 0) {
    throw new AppErrorZPRO('ERR_NO_GHOST_LISTS_FOUND', 404);
  }

  for (const ghostList of ghostLists) {
    await ghostList.destroy();
  }
};

export default DeleteAllGhostListsService; 