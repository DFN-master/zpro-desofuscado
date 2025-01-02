import { TenantZPRO } from '../models/TenantZPRO';

interface ShowHubTokenResponse {
  hubToken: string;
}

export const showHubToken = async (id: number): Promise<string> => {
  const tenant = await TenantZPRO.findOne({
    where: { id }
  });

  if (!tenant || typeof tenant.hubToken !== 'string') {
    throw new Error('Hub token not found');
  }

  return tenant.hubToken;
}; 