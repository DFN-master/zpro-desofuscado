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
    const webhookSettings = {
      webhookCreateUser: 'disabled',
      webhookCreateApi: 'disabled', 
      webhookCreateChannel: 'disabled',
      webhookRenewApi: 'disabled',
      webhookUpdateChannel: 'disabled',
      webhookUpdateUser: 'disabled',
      select_max: 'disabled'
    };

    // Buscar todos os tenants
    const tenants = await queryInterface.sequelize.query<TenantResult>(
      'SELECT id FROM "Tenants"',
      { type: QueryTypes.SELECT }
    );

    // Buscar o maior ID atual das configurações
    const maxIdResult = await queryInterface.sequelize.query<MaxIdResult>(
      'SELECT max(id) mId from "Settings"',
      { type: QueryTypes.SELECT }
    );
    
    const maxId = maxIdResult[0].mId;

    // Criar configurações para cada tenant
    await Promise.all(
      tenants.map(async (tenant, tenantIndex) => {
        const settings = Object.entries(webhookSettings).map(([key, value], settingIndex) => ({
          id: maxId + (tenantIndex * Object.keys(webhookSettings).length) + settingIndex + 1,
          key,
          value,
          tenantId: tenant.id,
          createdAt: new Date(),
          updatedAt: new Date()
        }));

        await queryInterface.bulkInsert('Settings', settings);
      })
    );
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.query(
      'SELECT id FROM "Settings"',
      { type: QueryTypes.SELECT }
    );
  }
};

export default migration; 