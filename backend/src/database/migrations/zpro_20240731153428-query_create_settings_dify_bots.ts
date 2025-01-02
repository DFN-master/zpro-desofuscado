import { QueryInterface, QueryTypes, Sequelize } from 'sequelize';
import { Migration } from '../types/Migration';

interface TenantResult {
  id: number;
}

interface SettingResult {
  mId: number;
}

interface SettingData {
  id: number;
  key: string;
  value: string;
  tenantId: number;
  createdAt: Date;
  updatedAt: Date;
}

const migration: Migration = {
  up: async (queryInterface: QueryInterface) => {
    const tenantQuery = 'SELECT id FROM "Tenants"';
    const settingsQuery = 'SELECT max(id) mId from "Settings"';

    const tenants = await queryInterface.sequelize.query<TenantResult>(tenantQuery, {
      type: QueryTypes.SELECT
    });

    const settings = await queryInterface.sequelize.query<SettingResult>(settingsQuery, {
      type: QueryTypes.SELECT
    });

    await Promise.all(
      tenants.map(async (tenant, tenantIndex) => {
        const { id: tenantId } = tenant;

        const defaultSettings: Omit<SettingData, 'id'>[] = [
          {
            key: 'dify',
            value: 'disabled',
            tenantId,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];

        const settingsWithIds: SettingData[] = defaultSettings.map((setting, settingIndex) => ({
          ...setting,
          id: settings[0].mId + tenantIndex * 1000 + settingIndex
        }));

        await queryInterface.bulkInsert('Settings', settingsWithIds);
      })
    );
  },

  down: async (queryInterface: QueryInterface) => {
    const query = 'SELECT id FROM "Tenants"';
    await queryInterface.sequelize.query(query, {
      type: QueryTypes.SELECT
    });
  }
};

export default migration; 