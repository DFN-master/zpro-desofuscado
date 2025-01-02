import { Sequelize, Op } from 'sequelize';
import GhostListZPRO from '../../models/GhostListZPRO';

interface ListGhostListParams {
  searchParam?: string;
  pageNumber?: string;
}

interface ListGhostListResponse {
  ghostList: GhostListZPRO[];
  count: number;
  hasMore: boolean;
}

const ListGhostListService = async ({
  searchParam = '',
  pageNumber = '1'
}: ListGhostListParams): Promise<ListGhostListResponse> => {
  // Configuração da busca com filtro case-insensitive
  const whereCondition = {
    message: Sequelize.where(
      Sequelize.fn('LOWER', Sequelize.col('message')),
      'LIKE',
      `%${searchParam.toLowerCase().trim()}%`
    )
  };

  // Configuração da paginação
  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  // Busca os registros no banco
  const { count, rows } = await GhostListZPRO.findAndCountAll({
    where: whereCondition,
    limit,
    offset,
    order: [['message', 'ASC']]
  });

  // Verifica se existem mais registros além da página atual
  const hasMore = count > (offset + rows.length);

  return {
    ghostList: rows,
    count,
    hasMore
  };
};

export default ListGhostListService; 