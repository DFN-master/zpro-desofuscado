import AppError from '../../errors/AppError';
import BanList from '../../models/BanList';

interface ICreateBanListDTO {
  groupId: string;
  number: string;
  userId: number;
  tenantId: number;
}

interface IWhereCondition {
  groupId: string;
  number: string;
  userId: number;
  tenantId: number;
}

const CreateBanListService = async ({
  groupId,
  number,
  userId,
  tenantId
}: ICreateBanListDTO): Promise<BanList> => {
  // Verifica se já existe um registro com os mesmos dados
  const banListExists = await BanList.findOne({
    where: {
      groupId,
      number,
      userId,
      tenantId
    }
  });

  // Se existir, lança erro de duplicação
  if (banListExists) {
    throw new AppError('ERR_BANLIST_DUPLICATED');
  }

  // Cria novo registro na lista de banimentos
  const banList = await BanList.create({
    groupId,
    number,
    userId,
    tenantId
  });

  return banList;
};

export default CreateBanListService; 