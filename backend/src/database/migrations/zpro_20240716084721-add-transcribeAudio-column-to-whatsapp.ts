import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const tableDefinition = {
      tableName: 'Whatsapps',
      transcribeAudioColumn: 'transcribeAudio',
      defaultValue: 'disabled',
      transcribeAudioJsonColumn: 'transcribeAudioJson'
    };

    await queryInterface.addColumn(
      tableDefinition.tableName,
      tableDefinition.transcribeAudioColumn,
      {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: tableDefinition.defaultValue
      }
    );

    await queryInterface.addColumn(
      tableDefinition.tableName,
      tableDefinition.transcribeAudioJsonColumn,
      {
        type: DataTypes.JSONB,
        allowNull: true
      }
    );
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    const tableDefinition = {
      tableName: 'Whatsapps',
      transcribeAudioColumn: 'transcribeAudio',
      transcribeAudioJsonColumn: 'transcribeAudioJson'
    };

    await queryInterface.removeColumn(
      tableDefinition.tableName,
      tableDefinition.transcribeAudioColumn
    );
    
    await queryInterface.removeColumn(
      tableDefinition.tableName,
      tableDefinition.transcribeAudioJsonColumn
    );
  }
};

export default migration; 