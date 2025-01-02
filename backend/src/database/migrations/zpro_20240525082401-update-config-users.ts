import { QueryInterface } from 'sequelize';
import { Migration } from '../types/Migration';

interface UserConfig {
  filtrosAtendimento: {
    searchParam: string;
    pageNumber: number;
    status: string[];
    showAll: boolean;
    count: number | null;
    queuesIds: number[];
    withUnreadMessages: boolean;
    isNotAssignedUser: boolean;
    includeNotQueueDefined: boolean;
  };
  isDark: boolean;
}

const migration: Migration = {
  up: async (queryInterface: QueryInterface) => {
    const defaultConfig: UserConfig = {
      filtrosAtendimento: {
        searchParam: '',
        pageNumber: 1,
        status: ['open', 'pending', 'closed'],
        showAll: false,
        count: null,
        queuesIds: [],
        withUnreadMessages: false,
        isNotAssignedUser: false,
        includeNotQueueDefined: true
      },
      isDark: false
    };

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkUpdate(
        'Users',
        {
          configs: JSON.stringify(defaultConfig)
        },
        {},
        { transaction }
      );
    });
  },

  down: async () => {
    throw new Error('Update configs error');
  }
};

export default migration; 