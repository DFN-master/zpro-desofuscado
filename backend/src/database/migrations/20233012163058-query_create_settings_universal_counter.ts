'use strict';

import { QueryInterface, QueryTypes } from 'sequelize';

interface Migration {
  up: (queryInterface: QueryInterface) => Promise<void>;
  down: (queryInterface: QueryInterface) => Promise<void>;
}

interface Tenant {
  id: number;
}

interface Setting {
  key: string;
  value: string;
  tenantId: number;
  createdAt: Date;
  updatedAt: Date;
  id?: number;
}

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    // Buscar todos os tenants
    const tenants = await queryInterface.sequelize.query(
      'SELECT id FROM "Tenants"',
      { type: QueryTypes.SELECT }
    ) as Tenant[];

    // Buscar o maior ID das configurações
    const maxSettings = await queryInterface.sequelize.query(
      'SELECT max(id) mId from "Settings"',
      { type: QueryTypes.SELECT }
    ) as { mId: number }[];

    // Criar novas configurações para cada tenant
    await Promise.all(
      tenants.map(async (tenant, tenantIndex) => {
        const settings: Setting[] = [{
          key: 'universalCounter',
          value: 'enabled',
          tenantId: tenant.id,
          createdAt: new Date(),
          updatedAt: new Date()
        }];

        const settingsWithIds = settings.map((setting, settingIndex) => ({
          ...setting,
          id: maxSettings[0].mId + tenantIndex * 1000 + settingIndex
        }));

        await queryInterface.bulkInsert('Settings', settingsWithIds);
      })
    );
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.query(
      'SELECT max(id) mId from "Settings"',
      { type: QueryTypes.SELECT }
    );
  }
};

export default migration; 