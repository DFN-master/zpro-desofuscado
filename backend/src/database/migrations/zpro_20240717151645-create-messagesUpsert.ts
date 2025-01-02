import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const tableName = 'MessageUpserts';

const migration: Migration = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable(tableName, {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      body: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      mediaType: {
        type: DataTypes.STRING
      },
      mediaUrl: {
        type: DataTypes.STRING
      },
      ticketId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Tickets',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      tenantId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Tenants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      isEdited: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      isForwarded: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      remoteJid: {
        type: DataTypes.STRING,
        allowNull: false
      },
      wid: {
        type: DataTypes.STRING,
        allowNull: true
      },
      dataJson: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      whatsappId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Whatsapps',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable(tableName);
  }
};

export default migration; 