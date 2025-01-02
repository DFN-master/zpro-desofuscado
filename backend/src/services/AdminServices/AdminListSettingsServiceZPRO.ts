import { Op } from 'sequelize';
import SettingZPRO from '../../models/SettingZPRO';

interface ListSettingsFilter {
  tenantId?: number;
}

const AdminListSettingsService = async (tenantId?: number) => {
  const where: ListSettingsFilter = {};
  
  if (tenantId) {
    where.tenantId = tenantId;
  }

  const settings = await SettingZPRO.findAll({
    where,
    order: [['id', 'ASC']]
  });

  return settings;
};

export default AdminListSettingsService; 