import { QueryInterface, QueryTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface) => {
    // Buscar todos os tenants
    const tenants = await queryInterface.sequelize.query(
      'SELECT id FROM "Tenants"',
      {
        type: QueryTypes.SELECT
      }
    );

    // Buscar o maior ID das configurações
    const maxSettings = await queryInterface.sequelize.query(
      'SELECT max(id) mId from "Settings"',
      {
        type: QueryTypes.SELECT
      }
    );

    // Criar configurações para cada tenant
    await Promise.all(
      tenants.map(async (tenant: { id: number }, tenantIndex: number) => {
        const { id: tenantId } = tenant;

        const settingsToCreate = [
          {
            key: 'chatgptAll',
            value: 'disabled',
            tenantId,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            key: 'dialogflowAll', 
            value: 'disabled',
            tenantId,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            key: 'typebotAll',
            value: 'disabled',
            tenantId,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];

        const settingsWithIds = settingsToCreate.map((setting, index) => ({
          ...setting,
          id: maxSettings[0].mId + tenantIndex * 3 + index + 1
        }));

        await queryInterface.bulkInsert('Settings', settingsWithIds);
      })
    );
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(
      'SELECT id FROM "Tenants"',
      {
        type: QueryTypes.SELECT
      }
    );
  }
};

export default migration; 