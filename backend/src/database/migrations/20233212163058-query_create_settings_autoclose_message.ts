import { QueryInterface, QueryTypes, Sequelize } from 'sequelize';

interface Migration {
  up: (queryInterface: QueryInterface) => Promise<void>;
  down: (queryInterface: QueryInterface) => Promise<void>;
}

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
    const tenantQuery = `
      SELECT id FROM "Tenants"
    `;

    const maxIdQuery = `
      SELECT max(id) mId FROM "Settings"
    `;

    const tenants = await queryInterface.sequelize.query<Tenant>(tenantQuery, {
      type: QueryTypes.SELECT
    });

    const maxId = await queryInterface.sequelize.query<{ mId: number }>(maxIdQuery, {
      type: QueryTypes.SELECT
    });

    await Promise.all(
      tenants.map(async (tenant, index) => {
        const settings: Setting[] = [{
          key: 'autoCloseMessage',
          value: 'Seu atendimento foi encerrado por falta de interação.',
          tenantId: tenant.id,
          createdAt: new Date(),
          updatedAt: new Date()
        }];

        const settingsWithIds = settings.map((setting, settingIndex) => ({
          ...setting,
          id: maxId[0].mId + index + settingIndex
        }));

        try {
          await queryInterface.bulkInsert('Settings', settingsWithIds);
        } catch (error) {
          console.warn(`Skipping duplicate key error for tenant ${tenant.id}`);
        }
      })
    );
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    const query = `
      SELECT id FROM "Settings" WHERE key = 'autoCloseMessage'
    `;
    
    await queryInterface.sequelize.query(query, {
      type: QueryTypes.SELECT
    });
  }
};

export default migration; 