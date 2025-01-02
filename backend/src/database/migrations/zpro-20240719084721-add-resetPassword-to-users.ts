import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const tableName = 'Users';
    const columns = {
      resetPasswordToken: {
        type: DataTypes.STRING,
        allowNull: true
      },
      resetPasswordExpires: {
        type: DataTypes.DATE,
        allowNull: true
      }
    };

    await Promise.all([
      queryInterface.addColumn(tableName, 'resetPasswordToken', columns.resetPasswordToken),
      queryInterface.addColumn(tableName, 'resetPasswordExpires', columns.resetPasswordExpires)
    ]);
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    const tableName = 'Users';
    
    await Promise.all([
      queryInterface.removeColumn(tableName, 'resetPasswordToken'),
      queryInterface.removeColumn(tableName, 'resetPasswordExpires')
    ]);
  }
};

export default migration; 