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
  value: string | number;
  tenantId: number;
  createdAt: Date;
  updatedAt: Date;
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

    // Buscar o maior ID das configurações
    const maxSettings = await queryInterface.sequelize.query<{ mId: number }>(
      'SELECT max(id) mId from "Settings"',
      {
        type: QueryTypes.SELECT
      }
    );

    // Criar novas configurações para cada tenant
    await Promise.all(
      tenants.map(async (tenant, index) => {
        const settings: Setting[] = [
          {
            key: 'autoClose',
            value: 'enabled',
            tenantId: tenant.id,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            key: 'autoCloseTime',
            value: 600,
            tenantId: tenant.id,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];

        // Adicionar IDs incrementais baseados no maior ID existente
        const settingsWithIds = settings.map((setting, i) => ({
          ...setting,
          id: maxSettings[0].mId + index + 1 + i
        }));

        try {
          await queryInterface.bulkInsert('Settings', settingsWithIds);
        } catch (error) {
          console.warn(`Skipping duplicate key error for tenant ${tenant.id}`);
        }
      })
    );
  },

  down: async (queryInterface: QueryInterface) => {
    // Remover configurações adicionadas
    await queryInterface.sequelize.query(
      'SELECT max(id) mId from "Settings"',
      {
        type: QueryTypes.SELECT
      }
    );
  }
};

export default migration; 