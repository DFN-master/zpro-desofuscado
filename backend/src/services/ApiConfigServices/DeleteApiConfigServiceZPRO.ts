import AppError from '../../errors/AppErrorZPRO';
import ApiConfig from '../../models/ApiConfigZPRO';

interface DeleteApiConfigRequest {
  apiId: number;
  tenantId: number;
}

const DeleteApiConfigService = async ({
  apiId,
  tenantId
}: DeleteApiConfigRequest): Promise<void> => {
  const apiConfig = await ApiConfig.findOne({
    where: {
      id: apiId,
      tenantId
    }
  });

  if (!apiConfig) {
    throw new AppError('ERR_API_CONFIG_NOT_FOUND', 404);
  }

  await apiConfig.destroy();
};

export default DeleteApiConfigService; 