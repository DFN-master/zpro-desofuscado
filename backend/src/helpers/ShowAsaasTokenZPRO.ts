import { Tenant } from '../models/TenantZPRO';

interface WhereCondition {
  id: number;
}

interface QueryOptions {
  where: WhereCondition;
}

const showAsaasToken = async (): Promise<string> => {
  const queryOptions: QueryOptions = {
    where: {
      id: 1
    }
  };

  const tenant = await Tenant.findOne(queryOptions);

  if (!tenant || typeof tenant.asaasToken !== 'string') {
    throw new Error('Asaas token not found');
  }

  return tenant.asaasToken;
};

export { showAsaasToken }; 