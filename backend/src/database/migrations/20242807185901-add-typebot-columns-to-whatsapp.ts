import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface) => {
    const tableName = 'Whatsapps';
    
    await queryInterface.addColumn(tableName, 'typebotOffStart', {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ''
    });

    await queryInterface.addColumn(tableName, 'typebotUrl', {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ''
    });

    await queryInterface.addColumn(tableName, 'typebotName', {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ''
    });

    await queryInterface.addColumn(tableName, 'typebotRes', {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ''
    });
  },

  down: async (queryInterface: QueryInterface) => {
    const tableName = 'Whatsapps';
    
    await queryInterface.removeColumn(tableName, 'typebotRes');
    await queryInterface.removeColumn(tableName, 'typebotName');
    await queryInterface.removeColumn(tableName, 'typebotUrl');
    await queryInterface.removeColumn(tableName, 'typebotOffStart');
  }
};

export default migration; 