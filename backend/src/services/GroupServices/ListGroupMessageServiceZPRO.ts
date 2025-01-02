import { GroupMessagesZPRO } from '../../models/GroupMessagesZPRO';

interface ListGroupMessageParams {
  tenantId: number | string;
}

const ListGroupMessageService = async ({ tenantId }: ListGroupMessageParams) => {
  const messages = await GroupMessagesZPRO.findAll({
    where: {
      tenantId
    },
    order: [
      ['group', 'ASC']
    ]
  });

  return messages;
};

export default ListGroupMessageService; 