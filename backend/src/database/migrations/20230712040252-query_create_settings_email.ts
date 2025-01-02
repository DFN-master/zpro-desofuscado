import { QueryInterface, DataTypes } from 'sequelize';
import { MigrationFn } from 'sequelize-cli';

interface Migration {
  up: MigrationFn;
  down: MigrationFn;
}

const migration: Migration = {
  up: async (queryInterface: QueryInterface) => {
    // Buscar todos os tenants
    const tenants = await queryInterface.sequelize.query(
      'SELECT id FROM "Tenants"',
      {
        type: DataTypes.SELECT
      }
    );

    // Buscar o último ID das configurações
    const maxSettings = await queryInterface.sequelize.query(
      'select max(id) mId from "Settings"',
      {
        type: DataTypes.SELECT
      }
    );

    // Criar configurações de email para cada tenant
    await Promise.all(
      tenants.map(async (tenant: any, tenantIndex: number) => {
        const { id: tenantId } = tenant;

        const defaultSettings = [
          {
            key: 'emailHost',
            value: 'smtp.gmail.com',
            tenantId,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            key: 'emailPort',
            value: 465,
            tenantId,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            key: 'emailSecure',
            value: false,
            tenantId,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            key: 'emailUser',
            value: 'email@gmail.com',
            tenantId,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            key: 'emailPass',
            value: '12345678',
            tenantId,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];

        const settingsWithIds = defaultSettings.map((setting, index) => ({
          ...setting,
          id: maxSettings[0].mId + tenantIndex * 5 + index
        }));

        await queryInterface.bulkInsert('Settings', settingsWithIds);
      })
    );
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query('SELECT id FROM "Tenants"', {
      type: DataTypes.SELECT
    });
  }
};

export default migration; 