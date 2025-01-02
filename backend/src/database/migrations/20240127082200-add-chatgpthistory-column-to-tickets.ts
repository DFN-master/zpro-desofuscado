'use strict';

import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface) => {
    return queryInterface.addColumn('Tickets', 'chatGptHistory', {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null
    });
  },

  down: async (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn('Tickets', 'chatGptHistory');
  }
};

export default migration; 