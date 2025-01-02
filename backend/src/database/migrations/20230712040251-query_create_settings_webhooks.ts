import { QueryInterface, QueryTypes } from 'sequelize';

interface Migration {
  up: (queryInterface: QueryInterface) => Promise<void>;
  down: (queryInterface: QueryInterface) => Promise<void>;
}

interface TenantResult {
  id: number;
}

interface MaxIdResult {
  mId: number;
}

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const tenants = await queryInterface.sequelize.query<TenantResult>(
      'SELECT id FROM "Tenants"',
      {
        type: QueryTypes.SELECT
      }
    );

    const maxId = await queryInterface.sequelize.query<MaxIdResult>(
      'SELECT select max(id) mId from "Settings"',
      {
        type: QueryTypes.SELECT
      }
    );

    await Promise.all(
      tenants.map(async (tenant, index) => {
        const settings = [
          {
            key: 'webhookMessage',
            value: 'disabled',
            tenantId: tenant.id,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];

        const settingsWithIds = settings.map((setting, settingIndex) => ({
          ...setting,
          id: maxId[0].mId + index + 1 + settingIndex
        }));

        await queryInterface.bulkInsert('Settings', settingsWithIds);
      })
    );
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.query(
      'SELECT id FROM "Settings"',
      {
        type: QueryTypes.SELECT
      }
    );
  }
};

export default migration; 