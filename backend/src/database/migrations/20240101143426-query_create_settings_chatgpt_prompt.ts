import { QueryInterface, QueryTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    // Buscar todos os tenants
    const tenants = await queryInterface.sequelize.query(
      'SELECT id FROM "Tenants"',
      {
        type: QueryTypes.SELECT
      }
    );

    // Buscar o último ID das configurações
    const lastSettings = await queryInterface.sequelize.query(
      'SELECT max(id) mId from "Settings"',
      {
        type: QueryTypes.SELECT
      }
    );

    // Criar novas configurações para cada tenant
    await Promise.all(
      tenants.map(async (tenant: any, index: number) => {
        const { id: tenantId } = tenant;

        const settings = [
          {
            key: 'chatgptPrompt',
            value: 'Atue como um vendedor',
            tenantId,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];

        const settingsWithIds = settings.map((setting, idx) => ({
          ...setting,
          id: lastSettings[0].mId + index + 1 + idx
        }));

        await queryInterface.bulkInsert('Settings', settingsWithIds);
      })
    );
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.query(
      'SELECT max(id) mId from "Settings"',
      {
        type: QueryTypes.SELECT
      }
    );
  }
};

export default migration; 