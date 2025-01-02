import { QueryInterface, DataTypes } from 'sequelize';

export default {
    up: async (queryInterface: QueryInterface) => {
        await queryInterface.createTable('ParticipantsLists', {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false
            },
            groupId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            number: {
                type: DataTypes.STRING,
                allowNull: false
            },
            userId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
                allowNull: false
            },
            tenantId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'Tenants',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                allowNull: false
            },
            name: {
                type: DataTypes.TEXT,
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
        await queryInterface.dropTable('ParticipantsLists');
    }
}; 