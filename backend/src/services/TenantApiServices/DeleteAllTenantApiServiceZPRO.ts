import { TenantApiZPRO } from '../../models/TenantApiZPRO';
import AppErrorZPRO from '../../errors/AppErrorZPRO';

interface IRequest {
  tenantId: number;
}

const DeleteAllTenantApiService = async ({ tenantId }: IRequest): Promise<void> => {
  const tenantApis = await TenantApiZPRO.findAll({
    where: { tenantId }
  });

  if (!tenantApis || tenantApis.length === 0) {
    throw new AppErrorZPRO('ERR_NO_TENANT_API_FOUND', 404);
  }

  for (const tenantApi of tenantApis) {
    await tenantApi.destroy();
  }
};

export default DeleteAllTenantApiService; 