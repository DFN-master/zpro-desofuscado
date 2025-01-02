import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const tableName = 'Whatsapps';
const columnName = 'importOldMessagesGroups';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.addColumn(tableName, columnName, {
    type: DataTypes.BOOLEAN,
    allowNull: true
  });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.removeColumn(tableName, columnName);
};

const migration: Migration = {
  up,
  down
};

export default migration; 