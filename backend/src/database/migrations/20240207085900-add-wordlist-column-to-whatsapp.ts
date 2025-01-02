import { QueryInterface, DataTypes } from 'sequelize';

export default {
    up: async (queryInterface: QueryInterface) => {
        await queryInterface.addColumn('Whatsapps', 'wordList', {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'disabled'
        });
    },
    down: async (queryInterface: QueryInterface) => {
        await queryInterface.removeColumn('Whatsapps', 'wordList');
    }
}; 