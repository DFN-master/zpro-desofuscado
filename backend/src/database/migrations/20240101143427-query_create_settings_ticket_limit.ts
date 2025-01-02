import { QueryInterface, QueryTypes, Sequelize } from 'sequelize';
import { Migration } from '../types/Migration';

interface TenantResult {
  id: number;
}

interface MaxIdResult {
  mId: number;
}

interface SettingRecord {
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
    const tenants = await queryInterface.sequelize.query<TenantResult>(
      'SELECT id FROM "Tenants"',
      {
        type: QueryTypes.SELECT
      }
    );

    // Buscar o maior ID atual das configurações
    const maxIds = await queryInterface.sequelize.query<MaxIdResult>(
      'SELECT max(id) "mId" from "Settings"',
      {
        type: QueryTypes.SELECT
      }
    );

    // Criar novas configurações para cada tenant
    await Promise.all(
      tenants.map(async (tenant, tenantIndex) => {
        const settings: SettingRecord[] = [
          {
            key: 'ticketLimit',
            value: 'enabled',
            tenantId: tenant.id,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            key: 'ticketDaysAgo',
            value: 30,
            tenantId: tenant.id,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];

        // Adicionar IDs incrementais baseados no maior ID existente
        const recordsWithIds = settings.map((setting, settingIndex) => ({
          ...setting,
          id: maxIds[0].mId + tenantIndex * 2 + settingIndex + 1
        }));

        await queryInterface.bulkInsert('Settings', recordsWithIds);
      })
    );
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.query(
      'SELECT id FROM "Tenants"',
      {
        type: QueryTypes.SELECT
      }
    );
  }
};

export default migration; 