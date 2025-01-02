import { Sequelize, Op } from 'sequelize';
import FarewellPrivateMessageZPRO from '../../models/FarewellPrivateMessageZPRO';

interface Request {
  searchParam?: string;
  pageNumber?: string;
  tenantId: number | string;
}

interface Response {
  farewellPrivateMessage: FarewellPrivateMessageZPRO[];
  count: number;
  hasMore: boolean;
}

const ListFarewellPrivateMessageService = async ({
  searchParam = '',
  pageNumber = '1',
  tenantId
}: Request): Promise<Response> => {
  const whereCondition = {
    message: Sequelize.where(
      Sequelize.fn('LOWER', Sequelize.col('message')),
      'LIKE',
      `%${searchParam.toLowerCase().trim()}%`
    ),
    tenantId
  };

  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  const { count, rows: farewellMessages } = await FarewellPrivateMessageZPRO.findAndCountAll({
    where: whereCondition,
    limit,
    offset,
    order: [['message', 'ASC']]
  });

  const hasMore = count > (offset + farewellMessages.length);

  return {
    farewellPrivateMessage: farewellMessages,
    count,
    hasMore
  };
};

export default ListFarewellPrivateMessageService; 