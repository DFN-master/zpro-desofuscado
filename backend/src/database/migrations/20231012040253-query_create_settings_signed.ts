import { QueryTypes, Sequelize } from 'sequelize';
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
  up: async (queryInterface: Sequelize) => {
    // Buscar todos os tenants
    const tenants = await queryInterface.sequelize.query<Tenant>(
      'SELECT id FROM "Tenants"',
      {
        type: QueryTypes.SELECT
      }
    );

    // Buscar o maior ID das configurações
    const maxSettings = await queryInterface.sequelize.query<{id: number}>(
      'select max(id) mId from "Settings"',
      {
        type: QueryTypes.SELECT
      }
    );

    // Criar novas configurações para cada tenant
    await Promise.all(
      tenants.map(async (tenant, tenantIndex) => {
        const settings: Partial<Setting>[] = [
          {
            key: 'signed',
            value: 'disabled',
            tenantId: tenant.id,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];

        const settingsWithIds = settings.map((setting, settingIndex) => ({
          ...setting,
          id: maxSettings[0].mId + tenantIndex + settingIndex
        }));

        await queryInterface.bulkInsert('Settings', settingsWithIds);
      })
    );
  },

  down: async (queryInterface: Sequelize) => {
    await queryInterface.sequelize.query(
      'SELECT id FROM "Tenants"',
      {
        type: QueryTypes.SELECT
      }
    );
  }
};

export default migration; 