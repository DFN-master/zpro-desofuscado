import TenantApiZPRO from "../../models/TenantApiZPRO";
import AppErrorZPRO from "../../errors/AppErrorZPRO";

interface IRequest {
  id: number;
  tenantId: number;
}

const DeleteTenantApiService = async ({ id, tenantId }: IRequest): Promise<void> => {
  const tenantApi = await TenantApiZPRO.findOne({
    where: {
      id,
      tenantId
    }
  });

  if (!tenantApi) {
    throw new AppErrorZPRO("ERR_NO_TENANT_API_FOUND", 404);
  }

  await tenantApi.destroy();
};

export default DeleteTenantApiService; 