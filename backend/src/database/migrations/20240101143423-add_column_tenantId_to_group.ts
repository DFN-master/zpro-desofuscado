import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const table = await queryInterface.describeTable('GroupMessages');

  if (!table || !table['tenantId']) {
    await queryInterface.addColumn('GroupMessages', 'tenantId', {
      type: DataTypes.INTEGER,
      references: {
        model: 'Tenants',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'restrict',
      allowNull: false,
      defaultValue: 1
    });
  }

  if (!table || !table['isActive']) {
    await queryInterface.addColumn('GroupMessages', 'isActive', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });
  }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.removeColumn('GroupMessages', 'tenantId');
  await queryInterface.removeColumn('GroupMessages', 'isActive');
};

const migration: Migration = {
  up,
  down
};

export default migration; 