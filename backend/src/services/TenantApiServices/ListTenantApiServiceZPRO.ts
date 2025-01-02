import { Sequelize, Op } from 'sequelize';
import TenantApiZPRO from '../../models/TenantApiZPRO';

interface ListTenantApiParams {
  searchParam?: string;
  pageNumber?: string;
  tenantId: number;
}

interface ListTenantApiResponse {
  tenantApis: TenantApiZPRO[];
  count: number;
  hasMore: boolean;
}

const ListTenantApiService = async ({
  searchParam = '',
  pageNumber = '1',
  tenantId
}: ListTenantApiParams): Promise<ListTenantApiResponse> => {
  const whereCondition = {
    apiToken: Sequelize.where(
      Sequelize.fn('LOWER', Sequelize.col('apiToken')),
      'LIKE',
      `%${searchParam.toLowerCase().trim()}%`
    ),
    tenantId
  };

  const limit = 20;
  const offset = limit * (Number(pageNumber) - 1);

  const { count, rows: tenantApis } = await TenantApiZPRO.findAndCountAll({
    where: whereCondition,
    limit,
    offset,
    order: [['apiToken', 'ASC']]
  });

  const hasMore = count > (offset + tenantApis.length);

  return {
    tenantApis,
    count,
    hasMore
  };
};

export default ListTenantApiService; 