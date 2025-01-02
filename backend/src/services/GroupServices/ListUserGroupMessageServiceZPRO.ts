import { QueryTypes } from 'sequelize';
import GroupMessagesZPRO from '../../models/GroupMessagesZPRO';

interface ListUserGroupMessageParams {
  tenantId: number;
  userId: number;
}

interface GroupMessage {
  id: number;
  message: string;
  contactId: number;
  userId: number;
  tenantId: number;
  createdAt: Date;
  updatedAt: Date;
}

const ListUserGroupMessageService = async ({
  tenantId,
  userId
}: ListUserGroupMessageParams): Promise<GroupMessage[]> => {
  const query = `
    SELECT q.* 
    FROM "GroupMessages" q,
         "Users" u,
         "UsersPrivateGroups" uq
    WHERE uq."groupId" = q.id
    AND q."tenantId" = :tenantId
    AND uq."userId" = u.id
    AND u.id = :userId
  `;

  const replacements = {
    tenantId,
    userId
  };

  const messages = await GroupMessagesZPRO.sequelize?.query(query, {
    replacements,
    nest: true,
    type: QueryTypes.SELECT
  });

  return messages as GroupMessage[];
};

export default ListUserGroupMessageService; 