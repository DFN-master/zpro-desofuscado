import { QueryInterface, DataTypes } from 'sequelize';

interface MigrationInterface {
  up: (queryInterface: QueryInterface) => Promise<void>;
  down: (queryInterface: QueryInterface) => Promise<void>;
}

const migration: MigrationInterface = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const tableName = 'Contacts';
    const columnName = 'kanban';

    await queryInterface.addColumn(tableName, columnName, {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    const tableName = 'Contacts';
    const columnName = 'kanban';

    await queryInterface.removeColumn(tableName, columnName);
  }
};

export default migration; 