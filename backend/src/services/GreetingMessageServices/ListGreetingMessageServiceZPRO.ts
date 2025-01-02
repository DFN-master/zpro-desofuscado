import { Sequelize, Op } from 'sequelize';
import GreetingMessageZPRO from '../../models/GreetingMessageZPRO';

interface Request {
  searchParam?: string;
  pageNumber?: string;
  tenantId: number | string;
}

interface Response {
  greetingMessages: GreetingMessageZPRO[];
  count: number;
  hasMore: boolean;
}

const ListGreetingMessageService = async ({
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

  const { count, rows: greetingMessages } = await GreetingMessageZPRO.findAndCountAll({
    where: whereCondition,
    limit,
    offset,
    order: [['message', 'ASC']]
  });

  const hasMore = count > offset + greetingMessages.length;

  return {
    greetingMessages,
    count,
    hasMore
  };
};

export default ListGreetingMessageService; 