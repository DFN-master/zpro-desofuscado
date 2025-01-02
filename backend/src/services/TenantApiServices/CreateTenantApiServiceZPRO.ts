import AppError from '../../errors/AppErrorZPRO';
import TenantApi from '../../models/TenantApiZPRO';

interface IRequest {
  apiToken: string;
  tenantId: string;
}

interface ITenantApi {
  apiToken: string;
  tenantId: string;
}

const CreateTenantApiService = async ({
  apiToken,
  tenantId,
}: IRequest): Promise<ITenantApi> => {
  // Verifica se já existe um tenant com o mesmo token
  const checkExistingTenant = await TenantApi.findOne({
    where: { apiToken, tenantId }
  });

  if (checkExistingTenant) {
    throw new AppError('ERR_TENANT_API_DUPLICATED');
  }

  // Cria novo tenant
  const tenant = await TenantApi.create({
    apiToken,
    tenantId
  });

  return tenant;
};

export default CreateTenantApiService; 