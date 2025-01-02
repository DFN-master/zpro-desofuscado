import { GhostList } from '../../models/GhostListZPRO';
import AppError from '../../errors/AppErrorZPRO';

interface UpdateGhostListData {
  shortcut: string;
  message: string;
}

interface Request {
  ghostListData: UpdateGhostListData;
  ghostListId: number;
}

const UpdateGhostListService = async ({
  ghostListData,
  ghostListId
}: Request): Promise<GhostList> => {
  const { shortcut, message } = ghostListData;

  // Busca a GhostList pelo ID
  const ghostList = await GhostList.findOne({
    where: { id: ghostListId },
    attributes: ['id', 'shortcut', 'message']
  });

  // Verifica se a GhostList existe
  if (!ghostList) {
    throw new AppError('Ghost List não encontrada', 404);
  }

  // Atualiza os dados
  await ghostList.update({
    shortcut,
    message
  });

  // Recarrega os dados atualizados
  await ghostList.reload({
    attributes: ['id', 'shortcut', 'message']
  });

  return ghostList;
};

export default UpdateGhostListService; 