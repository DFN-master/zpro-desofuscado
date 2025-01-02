import { Sequelize, Op } from 'sequelize';
import FarewellMessageZPRO from '../../models/FarewellMessageZPRO';

interface ListFarewellMessageParams {
  searchParam?: string;
  pageNumber?: string;
  tenantId: number | string;
}

interface ListFarewellMessageResponse {
  farewellMessages: FarewellMessageZPRO[];
  count: number;
  hasMore: boolean;
}

const ListFarewellMessageService = async ({
  searchParam = '',
  pageNumber = '1',
  tenantId
}: ListFarewellMessageParams): Promise<ListFarewellMessageResponse> => {
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

  const { count, rows: farewellMessages } = await FarewellMessageZPRO.findAndCountAll({
    where: whereCondition,
    limit,
    offset,
    order: [['message', 'ASC']]
  });

  const hasMore = count > offset + farewellMessages.length;

  return {
    farewellMessages,
    count,
    hasMore
  };
};

export default ListFarewellMessageService; 