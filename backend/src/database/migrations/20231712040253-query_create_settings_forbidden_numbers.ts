'use strict';

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
    const SELECT_TENANTS = 'SELECT id FROM "Tenants"';
    const SELECT_MAX_ID = 'SELECT max(id) mId from "Settings"';
    const TABLE_NAME = 'Settings';
    
    const tenants = await queryInterface.sequelize.query<TenantResult>(
      SELECT_TENANTS,
      { type: QueryTypes.SELECT }
    );

    const maxIdResults = await queryInterface.sequelize.query<MaxIdResult>(
      SELECT_MAX_ID,
      { type: QueryTypes.SELECT }
    );

    await Promise.all(
      tenants.map(async (tenant, tenantIndex) => {
        const settings = [{
          key: 'forbiddenNumbers',
          value: '5511912345678',
          tenantId: tenant.id,
          createdAt: new Date(),
          updatedAt: new Date()
        }];

        const settingsWithIds = settings.map((setting, settingIndex) => ({
          ...setting,
          id: maxIdResults[0].mId + tenantIndex * 100 + settingIndex
        }));

        await queryInterface.bulkInsert(TABLE_NAME, settingsWithIds);
      })
    );
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    const SELECT_TENANTS = 'SELECT id FROM "Tenants"';
    await queryInterface.sequelize.query(SELECT_TENANTS, {
      type: QueryTypes.SELECT
    });
  }
};

export default migration; 