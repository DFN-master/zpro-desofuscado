import { Sequelize } from 'sequelize';
import GroupLinkListZPRO from '../../models/GroupLinkListZPRO';

interface ListGroupLinkListResponse {
  groupLinkList: GroupLinkListZPRO[];
  count: number;
  hasMore: boolean;
}

interface ListGroupLinkListParams {
  searchParam?: string;
  pageNumber?: string;
}

const ListGroupLinkListService = async ({
  searchParam = '',
  pageNumber = '1'
}: ListGroupLinkListParams): Promise<ListGroupLinkListResponse> => {
  const whereCondition = {
    name: Sequelize.where(
      Sequelize.fn('LOWER', Sequelize.col('name')),
      'LIKE',
      `%${searchParam.toLowerCase().trim()}%`
    )
  };

  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  const { count, rows: groupLinkList } = await GroupLinkListZPRO.findAndCountAll({
    where: whereCondition,
    limit,
    offset,
    order: [['id', 'ASC']]
  });

  const hasMore = count > offset + groupLinkList.length;

  return {
    groupLinkList,
    count,
    hasMore
  };
};

export default ListGroupLinkListService; 