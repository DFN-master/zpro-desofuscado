import { Sequelize, Op } from 'sequelize';
import GroupLinkListZPRO from '../../models/GroupLinkListZPRO';

interface ListAllGroupLinkListParams {
  searchParam?: string;
}

interface ListAllGroupLinkListResponse {
  count: number;
  groupLinkList: GroupLinkListZPRO[];
}

const ListAllGroupLinkListService = async ({
  searchParam = ''
}: ListAllGroupLinkListParams): Promise<ListAllGroupLinkListResponse> => {
  const whereCondition = {
    name: Sequelize.where(
      Sequelize.fn('LOWER', Sequelize.col('name')),
      'LIKE',
      `%${searchParam.toLowerCase().trim()}%`
    )
  };

  const { count, rows: groupLinkList } = await GroupLinkListZPRO.findAndCountAll({
    where: whereCondition,
    order: [['name', 'ASC']]
  });

  return {
    groupLinkList,
    count
  };
};

export default ListAllGroupLinkListService; 