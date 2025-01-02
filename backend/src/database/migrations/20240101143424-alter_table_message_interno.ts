import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    return Promise.all([
      queryInterface.changeColumn('PrivateMessage', 'receiverId', {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: true
      }),
      
      queryInterface.changeColumn('PrivateMessage', 'groupId', {
        type: DataTypes.INTEGER,
        references: {
          model: 'GroupMessages',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: true
      })
    ]);
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    return Promise.all([
      queryInterface.changeColumn('PrivateMessage', 'receiverId', {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: true
      }),
      
      queryInterface.changeColumn('PrivateMessage', 'groupId', {
        type: DataTypes.INTEGER,
        references: {
          model: 'GroupMessages',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: true
      })
    ]);
  }
};

export default migration; 