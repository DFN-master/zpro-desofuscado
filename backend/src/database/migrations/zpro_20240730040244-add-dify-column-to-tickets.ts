import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.addColumn('Tickets', 'difyType', {
      type: DataTypes.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('Tickets', 'difySessionId', {
      type: DataTypes.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('Tickets', 'difyKey', {
      type: DataTypes.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('Tickets', 'difyUrl', {
      type: DataTypes.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('Tickets', 'difyStatus', {
      type: DataTypes.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('Tickets', 'difyOff', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.addColumn('Tickets', 'difyRestart', {
      type: DataTypes.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeColumn('Tickets', 'difyType');
    await queryInterface.removeColumn('Tickets', 'difySessionId');
    await queryInterface.removeColumn('Tickets', 'difyStatus');
    await queryInterface.removeColumn('Tickets', 'difyKey');
    await queryInterface.removeColumn('Tickets', 'difyUrl');
    await queryInterface.removeColumn('Tickets', 'difyOff');
    await queryInterface.removeColumn('Tickets', 'difyRestart');
  }
};

export default migration; 