import { QueryInterface } from 'sequelize';
import bcrypt from 'bcryptjs';

interface UserSeed {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  profile: string;
  tokenVersion: number;
  tenantId: number;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
}

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const defaultPassword = '$2a$08$/wEAiCMOIbjcpRQprgYeFryPcLkfGcnzxCN.gI0qS';
    
    const superAdminUser: UserSeed = {
      id: 1,
      name: 'Super Administrador',
      email: 'superadmin@zpro.io',
      passwordHash: defaultPassword,
      profile: 'admin',
      tokenVersion: 0,
      tenantId: 1,
      status: true,
      createdAt: new Date('2022-11-03 17:28:29.832'),
      updatedAt: new Date('2022-11-04 17:14:21.060')
    };

    await queryInterface.bulkInsert('Users', [superAdminUser], {});
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.bulkDelete('Users', {});
  }
}; 