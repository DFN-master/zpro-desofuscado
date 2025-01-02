import { QueryInterface, DataTypes } from "sequelize";
import { Migration } from "../types/Migration";

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.addColumn("Whatsapps", "isButton", {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: "enabled"
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeColumn("Whatsapps", "isButton");
  }
};

export default migration; 