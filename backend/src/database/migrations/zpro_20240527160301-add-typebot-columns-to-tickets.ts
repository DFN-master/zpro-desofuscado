import { QueryInterface, DataTypes } from "sequelize";
import { Migration } from "../types/Migration";

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const columns = {
      typebotUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: ""
      },
      typebotName: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: ""
      },
      typebotOffStart: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: ""
      },
      typebotResponse: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: ""
      }
    };

    // Adiciona as colunas sequencialmente
    await queryInterface.addColumn("Tickets", "typebotUrl", columns.typebotUrl);
    await queryInterface.addColumn("Tickets", "typebotName", columns.typebotName);
    await queryInterface.addColumn("Tickets", "typebotOffStart", columns.typebotOffStart);
    await queryInterface.addColumn("Tickets", "typebotResponse", columns.typebotResponse);
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    // Remove as colunas na ordem inversa
    await queryInterface.removeColumn("Tickets", "typebotResponse");
    await queryInterface.removeColumn("Tickets", "typebotOffStart");
    await queryInterface.removeColumn("Tickets", "typebotName");
    await queryInterface.removeColumn("Tickets", "typebotUrl");
  }
};

export default migration; 