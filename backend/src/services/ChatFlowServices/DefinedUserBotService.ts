import { QueryTypes, Op } from 'sequelize';
import User from '../../models/User';
import Ticket from '../../models/Ticket';
import CreateLogTicketService from '../TicketServices/CreateLogTicketService';
import logger from '../../utils/logger';

interface UpdateUserData {
  userId: number;
  ticketId: number;
  type: string;
  queueId: number;
}

const DefinedUserBotService = async (
  ticket: Ticket,
  queueId: number,
  tenantId: number,
  type: string = 'R'
): Promise<void> => {
  if (type === 'N') return;

  const findLeastBusyUser = async (tenantId: number): Promise<number | null> => {
    try {
      const users = await Ticket.findAll({
        attributes: [
          'userId',
          [
            sequelize.fn('COUNT', sequelize.col('Tickets.userId')),
            'ticketCount'
          ]
        ],
        where: {
          tenantId,
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
      logger.error('Erro ao buscar usuário com menor número de tickets:', error);
      return null;
    }
  };

  if (type === 'B') {
    try {
      const userId = await findLeastBusyUser(tenantId);
      
      if (userId) {
        logger.info('ID do usuário com menor número de tickets:', userId);
        await ticket.update({ userId });

        await CreateLogTicketService({
          ticketId: ticket.id,
          userId: ticket.id,
          type: 'userDefine',
          queueId: userId
        });
      } else {
        logger.info('Nenhum usuário encontrado com menor número de tickets');
      }
    } catch (error) {
      logger.error('Erro:', error);
    }
  }

  if (type === 'R') {
    const query = `
      SELECT u.id 
      FROM "Users" u
      LEFT JOIN "UsersQueues" uq ON (u.id = uq."userId")
      WHERE u."tenantId" = :tenantId 
        AND u."profile" = 'user'
        AND u."isOnline" = true
        AND uq."queueId" = :queueId
      ORDER BY RANDOM()
      LIMIT 1
    `;

    const users = await User.sequelize?.query(query, {
      replacements: {
        tenantId,
        queueId
      },
      type: QueryTypes.SELECT
    });

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