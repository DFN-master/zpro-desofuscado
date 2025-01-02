'use strict';

import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const TABLE_NAME = 'MessageUpserts';
    const COLUMN_NAME = 'imported';

    await queryInterface.addColumn(TABLE_NAME, COLUMN_NAME, {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    const TABLE_NAME = 'MessageUpserts';
    const COLUMN_NAME = 'imported';

    await queryInterface.removeColumn(TABLE_NAME, COLUMN_NAME);
  }
};

export default migration; 