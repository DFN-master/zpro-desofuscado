import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface) => {
    const TABLE_NAME = 'ReadPrivateMessageGroups';
    const PRIVATE_MESSAGE_TABLE = 'PrivateMessage';
    const USERS_PRIVATE_GROUPS_TABLE = 'UsersPrivateGroups';

    await queryInterface.createTable(TABLE_NAME, {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      internalMessageId: {
        type: DataTypes.INTEGER,
        references: {
          model: PRIVATE_MESSAGE_TABLE,
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      userGroupId: {
        type: DataTypes.BIGINT,
        references: {
          model: USERS_PRIVATE_GROUPS_TABLE,
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: false
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable('ReadPrivateMessageGroups');
  }
};

export default migration; 