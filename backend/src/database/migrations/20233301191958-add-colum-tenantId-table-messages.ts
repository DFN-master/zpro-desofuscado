import { QueryInterface, DataTypes } from 'sequelize';

interface MigrationInterface {
  up: (queryInterface: QueryInterface) => Promise<void>;
  down: (queryInterface: QueryInterface) => Promise<void>;
}

const migration: MigrationInterface = {
  up: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.addColumn('LogTickets', 'tenantId', {
        type: DataTypes.INTEGER,
        references: {
          model: 'Tenants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'restrict',
        allowNull: true,
        defaultValue: null
      })
    ]);
  },

  down: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.removeColumn('LogTickets', 'tenantId')
    ]);
  }
};

export default migration; 