import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

interface Tenant {
  id: number;
}

interface SettingsData {
  key: string;
  value: string;
  tenantId: number;
  createdAt: Date;
  updatedAt: Date;
  id?: number;
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

    // Buscar o último ID das configurações
    const maxSettings = await queryInterface.sequelize.query(
      'select max(id) mid from "Settings"',
      {
        type: DataTypes.SELECT
      }
    );

    // Criar configurações para cada tenant
    await Promise.all(
      tenants.map(async (tenant, index) => {
        const { id: tenantId } = tenant;

        const settingsData: SettingsData[] = [
          {
            key: 'n8n',
            value: 'disabled',
            tenantId,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];

        const settingsWithIds = settingsData.map((setting, settingIndex) => ({
          ...setting,
          id: maxSettings[0].mid + index * 1000 + settingIndex
        }));

        await queryInterface.bulkInsert('Settings', settingsWithIds);
      })
    );
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.query('SELECT id FROM "Tenants"', {
      type: DataTypes.SELECT
    });
  }
};

export default migration; 