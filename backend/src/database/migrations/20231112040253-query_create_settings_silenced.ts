import { QueryInterface, QueryTypes, Sequelize } from 'sequelize';
import { Migration } from '../types/Migration';

interface Tenant {
  id: number;
}

interface MaxIdResult {
  mId: number;
}

const migration: Migration = {
  up: async (queryInterface: QueryInterface) => {
    // Buscar todos os tenants
    const tenants = await queryInterface.sequelize.query<Tenant>(
      'SELECT id FROM "Tenants"',
      {
        type: QueryTypes.SELECT
      }
    );

    // Obter o maior ID atual das configurações
    const maxIds = await queryInterface.sequelize.query<MaxIdResult>(
      'SELECT max(id) mId from "Settings"',
      {
        type: QueryTypes.SELECT
      }
    );

    // Criar configurações de notificação silenciada para cada tenant
    await Promise.all(
      tenants.map(async (tenant, index) => {
        const settings = [{
          key: 'notificationSilenced',
          value: 'enabled',
          tenantId: tenant.id,
          createdAt: new Date(),
          updatedAt: new Date()
        }];

        const settingsWithIds = settings.map((setting, settingIndex) => ({
          ...setting,
          id: maxIds[0].mId + index + 1 + settingIndex
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