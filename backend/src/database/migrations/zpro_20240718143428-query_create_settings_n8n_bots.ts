import { QueryTypes, Sequelize } from 'sequelize';
import { Migration } from '../types/Migration';

interface TenantResult {
  id: number;
}

interface MaxIdResult {
  mId: number;
}

const migration: Migration = {
  up: async (queryInterface: Sequelize) => {
    // Buscar todos os tenants
    const tenants = await queryInterface.sequelize.query<TenantResult>(
      'SELECT id FROM "Tenants"',
      {
        type: QueryTypes.SELECT
      }
    );

    // Buscar o maior ID das configurações
    const maxIds = await queryInterface.sequelize.query<MaxIdResult>(
      'SELECT max(id) mId from "Settings"',
      {
        type: QueryTypes.SELECT
      }
    );

    // Criar configurações para cada tenant
    await Promise.all(
      tenants.map(async (tenant, index) => {
        const settings = [{
          key: 'n8nAllTickets',
          value: 'disabled',
          tenantId: tenant.id,
          createdAt: new Date(),
          updatedAt: new Date()
        }];

        const settingsWithIds = settings.map((setting, i) => ({
          ...setting,
          id: maxIds[0].mId + index + 1 + i
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