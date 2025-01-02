import { Sequelize, Op } from 'sequelize';
import BanListZPRO from '../../models/BanList/ZPRO';

interface ListBanListParams {
  searchParam?: string;
  pageNumber?: string;
  tenantId: number;
}

interface ListBanListResponse {
  banList: BanListZPRO[];
  count: number;
  hasMore: boolean;
}

const ListBanListService = async ({
  searchParam = '',
  pageNumber = '1',
  tenantId
}: ListBanListParams): Promise<ListBanListResponse> => {
  const whereCondition = {
    number: Sequelize.where(
      Sequelize.fn('LOWER', Sequelize.col('number')),
      'LIKE',
      `%${searchParam.toLowerCase().trim()}%`
    ),
    tenantId
  };

  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  const { count, rows: banList } = await BanListZPRO.findAndCountAll({
    where: whereCondition,
    limit,
    offset,
    order: [['number', 'ASC']]
  });

  const hasMore = count > offset + banList.length;

  return {
    banList,
    count,
    hasMore
  };
};

export default ListBanListService; 