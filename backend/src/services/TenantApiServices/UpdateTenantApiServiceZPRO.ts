import TenantApiZPRO from '../../models/TenantApiZPRO';
import AppErrorZPRO from '../../errors/AppErrorZPRO';

interface IRequest {
  tenantApiData: {
    apiToken: string;
    tenantId: string;
  };
  tenantApiId: string;
}

interface IAttributes {
  id: string;
  apiToken: string;
}

const UpdateTenantApiService = async ({
  tenantApiData,
  tenantApiId
}: IRequest): Promise<TenantApiZPRO> => {
  const { apiToken, tenantId } = tenantApiData;

  const tenantApi = await TenantApiZPRO.findOne({
    where: {
      id: tenantApiId,
      tenantId
    },
    attributes: ['id', 'apiToken']
  });

  if (!tenantApi) {
    throw new AppErrorZPRO('ERR_NO_TENANT_API_FOUND', 404);
  }

  await tenantApi.update({
    apiToken
  });

  await tenantApi.reload({
    attributes: ['id', 'apiToken']
  });

  return tenantApi;
};

export default UpdateTenantApiService; 