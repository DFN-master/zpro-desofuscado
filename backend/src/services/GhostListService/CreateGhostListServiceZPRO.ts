import AppError from '../../errors/AppError';
import GhostList from '../../models/GhostList';

interface CreateGhostListData {
  shortcut: string;
  message: string;
}

interface GhostListResponse {
  id: number;
  shortcut: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

const CreateGhostListService = async ({
  shortcut,
  message
}: CreateGhostListData): Promise<GhostListResponse> => {
  // Verifica se já existe um atalho igual
  const ghostListExists = await GhostList.findOne({
    where: { shortcut }
  });

  if (ghostListExists) {
    throw new AppError('ERR_SHORTCUT_DUPLICATED');
  }

  // Cria novo registro na lista de atalhos
  const ghostList = await GhostList.create({
    shortcut,
    message
  });

  return ghostList;
};

export default CreateGhostListService; 