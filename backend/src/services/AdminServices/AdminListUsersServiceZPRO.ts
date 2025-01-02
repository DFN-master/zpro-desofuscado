import { Op, fn, col, WhereOptions } from 'sequelize';
import Queue from '../../models/QueueZPRO';
import Tenant from '../../models/TenantZPRO';
import User from '../../models/UserZPRO';

interface Request {
  searchParam?: string;
  pageNumber?: string;
}

interface Response {
  users: User[];
  count: number;
  hasMore: boolean;
}

interface SearchWhereOptions extends WhereOptions {
  [Op.or]: Array<{
    name?: any;
    email?: any;
  }>;
}

const AdminListUsersService = async ({
  searchParam = '',
  pageNumber = '1'
}: Request): Promise<Response> => {
  const whereCondition: SearchWhereOptions = {
    [Op.or]: [
      {
        name: {
          [Op.like]: fn('LOWER', col('User.name')),
          like: `%${searchParam.toLowerCase()}%`
        }
      },
      {
        email: {
          [Op.like]: `%${searchParam.toLowerCase()}%`
        }
      }
    ]
  };

  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  const { count, rows: users } = await User.findAndCountAll({
    where: whereCondition,
    include: [
      {
        model: Queue,
        attributes: ['id', 'name']
      },
      {
        model: Tenant,
        attributes: ['id', 'name']
      }
    ],
    attributes: ['name', 'id', 'email', 'profile'],
    limit,
    offset,
    distinct: true,
    order: [['name', 'ASC']]
  });

  const hasMore = count > offset + users.length;

  return {
    users,
    count,
    hasMore
  };
};

export default AdminListUsersService; 