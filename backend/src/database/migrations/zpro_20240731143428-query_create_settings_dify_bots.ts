import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

interface Tenant {
  id: number;
}

interface Setting {
  id: number;
  key: string;
  value: string;
  tenantId: number;
  createdAt: Date;
  updatedAt: Date;
}

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    // Buscar todos os tenants
    const tenants = await queryInterface.sequelize.query(
      'SELECT id FROM "Tenants"',
      {
        type: DataTypes.SELECT
      }
    ) as Tenant[];

    // Buscar o maior ID das configurações
    const maxSettings = await queryInterface.sequelize.query(
      'SELECT max(id) mId FROM "Settings"',
      {
        type: DataTypes.SELECT
      }
    ) as { mid: number }[];

    // Criar novas configurações para cada tenant
    await Promise.all(
      tenants.map(async (tenant, tenantIndex) => {
        const { id: tenantId } = tenant;

        const settingsToInsert: Setting[] = [{
          key: 'difyAllTickets',
          value: 'disabled',
          tenantId,
          createdAt: new Date(),
          updatedAt: new Date()
        }];

        const settingsWithIds = settingsToInsert.map((setting, settingIndex) => ({
          ...setting,
          id: maxSettings[0].mid + tenantIndex * 100 + settingIndex + 1
        }));

        await queryInterface.bulkInsert('Settings', settingsWithIds);
      })
    );
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.query(
      'SELECT id FROM "Tenants"',
      {
        type: DataTypes.SELECT
      }
    );
  }
};

export default migration; 