'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

interface MigrationInterface {
  up: (queryInterface: QueryInterface) => Promise<void>;
  down: (queryInterface: QueryInterface) => Promise<void>;
}

const migration: MigrationInterface = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    // Buscar todos os tenants
    const tenants = await queryInterface.sequelize.query(
      'SELECT id FROM "Tenants"',
      {
        type: DataTypes.SELECT
      }
    );

    // Buscar o último ID das configurações
    const settings = await queryInterface.sequelize.query(
      'SELECT max(id) mId from "Settings"',
      {
        type: DataTypes.SELECT
      }
    );

    // Criar configurações SMTP para cada tenant
    await Promise.all(
      tenants.map(async (tenant: any, index: number) => {
        const { id: tenantId } = tenant;

        const defaultSettings = [
          {
            key: 'smtp',
            value: 'disabled',
            tenantId,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];

        // Gerar IDs únicos para cada configuração
        const settingsWithIds = defaultSettings.map((setting, settingIndex) => ({
          ...setting,
          id: settings[0].mId + index + settingIndex + 1
        }));

        await queryInterface.bulkInsert('Settings', settingsWithIds);
      })
    );
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.query(
      'SELECT id FROM "Tenants"',
      {
        type: DataTypes.SELECT
      }
    );
  }
};

export default migration; 