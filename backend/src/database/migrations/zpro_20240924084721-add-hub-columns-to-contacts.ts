import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const tableName = 'Contacts';

const columns = {
  hubWidget: 'hubWidget',
  hubTelegram: 'hubTelegram',
  hubWhatsapp: 'hubWhatsapp',
  hubTwitter: 'hubTwitter',
  hubEmail: 'hubEmail',
  hubSms: 'hubSms',
  hubMercadoLivre: 'hubMercadoLivre',
  hubOlx: 'hubOlx',
  hubWebchat: 'hubWebchat',
  hubTiktok: 'hubTiktok',
  hubIfood: 'hubIfood',
  hubYoutube: 'hubYoutube',
  hubLinkedin: 'hubLinkedin'
};

const columnConfig = {
  type: DataTypes.TEXT,
  allowNull: true,
  defaultValue: null
};

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    return Promise.all(
      Object.values(columns).map(column =>
        queryInterface.addColumn(tableName, column, columnConfig)
      )
    );
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    return Promise.all(
      Object.values(columns).map(column =>
        queryInterface.removeColumn(tableName, column)
      )
    );
  }
};

export default migration; 