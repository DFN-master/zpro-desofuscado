import { TenantZPRO } from '../../models/TenantZPRO';

interface OrderConfig {
  order: [string, string][];
}

const AdminListTenantsService = async (): Promise<TenantZPRO[]> => {
  const orderConfig: OrderConfig = {
    order: [['name', 'ASC']]
  };

  const tenants = await TenantZPRO.findAll(orderConfig);
  return tenants;
};

export default AdminListTenantsService; 