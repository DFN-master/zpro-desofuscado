import { QueryTypes, Op } from 'sequelize';
import User from '../../models/UserZPRO';
import Ticket from '../../models/TicketZPRO';
import CreateLogTicketService from '../TicketServices/CreateLogTicketServiceZPRO';
import { logger } from '../../utils/loggerZPRO';

interface UpdateUserData {
  userId: number;
  ticketId: number;
  type: string;
  queueId: number;
}

interface QueryParams {
  replacements: {
    tenantId: number;
    queueId: number;
  };
  type: QueryTypes;
}

const DefinedUserBotService = async (
  ticket: any,
  queueId: number,
  tenantId: number,
  type: string = 'R'
): Promise<void> => {
  if (type === 'N') return;

  const findUserWithLessTickets = async (searchTenantId: number): Promise<number | null> => {
    try {
      const users = await Ticket.findAll({
        attributes: [
          'userId',
          [sequelize.fn('COUNT', sequelize.col('Tickets.userId')), 'ticketCount']
        ],
        where: {
          tenantId: searchTenantId,
          status: {
            [Op.ne]: 'closed'
          }
        },
        include: [{
          model: User,
          attributes: [],
          where: {
            profile: {
              [Op.ne]: 'admin'
            }
          }
        }],
        group: ['userId'],
        order: sequelize.literal('ticketCount ASC'),
        limit: 1
      });

      return users.length > 0 ? users[0].userId : null;

    } catch (error) {
      logger.warn('Erro ao buscar usuário com menor número de tickets:', error);
      return null;
    }
  };

  // Lógica para atribuição de bot
  if (type === 'B') {
    try {
      const userId = await findUserWithLessTickets(tenantId);
      
      if (userId !== null) {
        logger.warn('ID do usuário com menor número de tickets:', userId);
        await ticket.update({ userId });
        
        await CreateLogTicketService({
          ticketId: ticket.id,
          userId: ticket.id,
          type: 'userDefine',
          queueId: userId
        });
      } else {
        logger.warn('Nenhum usuário encontrado com o menor número de tickets');
      }
    } catch (error) {
      logger.warn('Erro ao buscar usuário:', error);
    }
  }

  // Lógica para atribuição regular
  if (type === 'R') {
    const query = `
      SELECT u.id 
      FROM "Users" u
      LEFT JOIN "UsersQueues" uq ON (u.id = uq."userId")
      WHERE u."tenantId" = :tenantId
        AND u."profile" = 'user'
        AND u."isOnline" = true
        AND uq."queueId" = :queueId
      ORDER BY random()
      LIMIT 1
    `;

    const queryParams: QueryParams = {
      replacements: {
        tenantId,
        queueId
      },
      type: QueryTypes.SELECT
    };

    const users = await User.sequelize?.query(query, queryParams);

    if (users?.length) {
      const userId = users[0].id;
      await ticket.update({ userId });

      await CreateLogTicketService({
        ticketId: ticket.id,
        userId: ticket.id,
        type: 'userDefine',
        queueId: userId
      });
    }
  }
};

export default DefinedUserBotService; 