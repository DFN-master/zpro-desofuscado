import { QueryInterface, QueryTypes } from 'sequelize';

interface Migration {
  up: (queryInterface: QueryInterface) => Promise<void>;
  down: (queryInterface: QueryInterface) => Promise<void>;
}

interface Setting {
  id: number;
  key: string;
  value: string | number;
  tenantId: number;
  createdAt: Date;
  updatedAt: Date;
}

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    // Buscar todos os tenants
    const tenants = await queryInterface.sequelize.query(
      'SELECT id FROM "Tenants"',
      { type: QueryTypes.SELECT }
    );

    // Buscar o último ID das configurações
    const lastSettings = await queryInterface.sequelize.query(
      'select max(id) mId from "Settings"',
      { type: QueryTypes.SELECT }
    );

    // Criar configurações para cada tenant
    await Promise.all(
      tenants.map(async (tenant: { id: number }, tenantIndex: number) => {
        const settings: Setting[] = [
          {
            key: 'chatgptApi',
            value: 'sk-EuFZ2KP4JZTUP3J',
            tenantId: tenant.id,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            key: 'chatgptOrganizationId',
            value: 'org-cpcZhKJaBy0h2865',
            tenantId: tenant.id,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            key: 'chatgptOffset',
            value: 'zN1MutPePy6p3T3BlbkF',
            tenantId: tenant.id,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            key: 'chatgptExp',
            value: 'BSDI0gn4UD',
            tenantId: tenant.id,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            key: 'chatgptOfficial',
            value: 20,
            tenantId: tenant.id,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];

        // Adicionar IDs sequenciais às configurações
        const settingsWithIds = settings.map((setting, index) => ({
          ...setting,
          id: lastSettings[0].mId + (tenantIndex * 5) + index
        }));

        await queryInterface.bulkInsert('Settings', settingsWithIds);
      })
    );
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.query('SELECT id FROM "Tenants"', {
      type: QueryTypes.SELECT
    });
  }
};

export default migration; 