import { ApiConfigZPRO } from '../../models/ApiConfigZPRO';

interface RequestData {
  tenantId: number;
}

interface ResponseData {
  apis: ApiConfigZPRO[];
}

const ListApiConfigService = async ({ tenantId }: RequestData): Promise<ResponseData> => {
  const apis = await ApiConfigZPRO.findAll({
    where: { tenantId },
    order: [['name', 'ASC']]
  });

  return { apis };
};

export default ListApiConfigService; 