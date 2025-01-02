import { QueryTypes } from 'sequelize';
import GroupMessagesZPRO from '../../models/GroupMessagesZPRO';

interface QueryParams {
  replacements: {
    userId: number;
  };
  nest: boolean;
  type: QueryTypes;
}

const ListGroupsMessageByUserId = async (userId: number): Promise<any> => {
  const query = `
    SELECT 
      DISTINCT
      g.id,
      n."group",
      mi1."text",
      mi1."senderId",
      mi1."createdAt",
      mm_last_message."timestamp"
    FROM "PrivateGroup" g
    LEFT JOIN "UserPrivateGroup" ug ON ug."groupId" = g.id
    LEFT JOIN "PrivateMessage" mi1 ON mi1."groupId" = g.id
    LEFT JOIN LATERAL (
      SELECT 
        max(mi2."createdAt") as "timestamp"
      FROM "PrivateMessage" mi2 
      WHERE mi2."groupId" = g.id
    ) AS mm_last_message ON true
    LEFT JOIN "ReadMessages" rmg ON rmg."internalMessageId" = mi1.id
    WHERE ug."userId" = :userId
    AND ug."groupId" = g.id
    AND g."isActive" = true
    AND mi1.id NOT IN (
      SELECT 
        count(mi.*)
      FROM "PrivateMessage" mi
      WHERE mi."senderId" != :userId
      AND mi."groupId" = g.id
    )
  `;

  const queryParams: QueryParams = {
    replacements: {
      userId
    },
    nest: true,
    type: QueryTypes.SELECT
  };

  const results = await GroupMessagesZPRO.sequelize?.query(query, queryParams);

  return results;
};

export default ListGroupsMessageByUserId; 