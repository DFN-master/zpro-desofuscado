import { QueryInterface } from 'sequelize';

interface Migration {
  up: (queryInterface: QueryInterface) => Promise<void>;
  down: (queryInterface: QueryInterface) => Promise<void>;
}

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.query(`
      INSERT INTO public."Tenants" (
        "id",
        "status",
        "name",
        "businessHours",
        "messageBusinessHours",
        "maxUsers",
        "maxConnections",
        "ownerId",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        1,
        'active',
        'Empresa 01',
        '[
          {
            "day": 0,
            "hr1": "08:00",
            "hr2": "12:00",
            "hr3": "14:00",
            "hr4": "18:00",
            "type": "O",
            "label": "Domingo"
          },
          {
            "day": 1,
            "hr1": "08:00",
            "hr2": "12:00",
            "hr3": "14:00",
            "hr4": "18:00",
            "type": "O",
            "label": "Segunda-Feira"
          },
          {
            "day": 2,
            "hr1": "08:00",
            "hr2": "12:00",
            "hr3": "14:00",
            "hr4": "18:00",
            "type": "O",
            "label": "Terça-Feira"
          },
          {
            "day": 3,
            "hr1": "08:00",
            "hr2": "12:00",
            "hr3": "14:00",
            "hr4": "18:00",
            "type": "O",
            "label": "Quarta-Feira"
          },
          {
            "day": 4,
            "hr1": "08:00",
            "hr2": "12:00",
            "hr3": "14:00",
            "hr4": "18:00",
            "type": "O",
            "label": "Quinta-Feira"
          },
          {
            "day": 5,
            "hr1": "08:00",
            "hr2": "12:00",
            "hr3": "14:00",
            "hr4": "18:00",
            "type": "O",
            "label": "Sexta-Feira"
          },
          {
            "day": 6,
            "hr1": "08:00",
            "hr2": "12:00",
            "hr3": "14:00",
            "hr4": "18:00",
            "type": "O",
            "label": "Sábado"
          }
        ]',
        'Olá! Fantástico! No momento estamos ausentes mas vamos priorizar seu atendimento e retornaremos logo mais. Agradecemos muito o seu contato.',
        100,
        100,
        NULL,
        '2021-03-10 17:28:29.000',
        '2021-03-10 17:28:29.000'
      )
      ON CONFLICT (id) DO NOTHING;
    `);
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.bulkDelete('Tenants', {});
  }
};

export default migration; 