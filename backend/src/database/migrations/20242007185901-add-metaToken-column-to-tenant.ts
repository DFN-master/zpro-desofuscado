import { QueryInterface, DataTypes } from 'sequelize';
import crypto from 'crypto';

function generateRandomToken(length: number): string {
  return crypto.randomBytes(length).toString('hex');
}

const tokenLength = 32;

interface Migration {
  up: (queryInterface: QueryInterface) => Promise<void>;
  down: (queryInterface: QueryInterface) => Promise<void>;
}

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    return queryInterface.addColumn('Tenants', 'metaToken', {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: generateRandomToken(tokenLength)
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    return queryInterface.removeColumn('Tenants', 'metaToken');
  }
};

export default migration; 