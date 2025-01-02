'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

interface MigrationInterface {
  up: (queryInterface: QueryInterface) => Promise<void>;
  down: (queryInterface: QueryInterface) => Promise<void>;
}

const migration: MigrationInterface = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.changeColumn('Settings', 'id', {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.changeColumn('Settings', 'id', {
      type: DataTypes.INTEGER,
      allowNull: false
    });
  }
};

export default migration; 