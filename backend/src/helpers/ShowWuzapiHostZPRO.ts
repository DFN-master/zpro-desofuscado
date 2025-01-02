import { TenantZPRO } from '../models/TenantZPRO';

interface WuzapiHostResponse {
  id: number;
  wuzapiHost: string;
}

export const showWuzapiHost = async (id: number): Promise<string> => {
  try {
    const tenant = await TenantZPRO.findOne({
      where: { id }
    }) as WuzapiHostResponse;

    if (!tenant || typeof tenant.wuzapiHost !== 'string') {
      throw new Error('Wuzapi host not found');
    }

    return tenant.wuzapiHost;
  } catch (error) {
    throw error;
  }
}; 