import AppError from "../../errors/AppError";
import TenantApi from "../../models/TenantApi";

const ShowTenantApiService = async (id: number): Promise<TenantApi> => {
  const tenant = await TenantApi.findByPk(id);

  if (!tenant) {
    throw new AppError("ERR_NO_TENANT_API_FOUND", 404);
  }

  return tenant;
};

export default ShowTenantApiService; 