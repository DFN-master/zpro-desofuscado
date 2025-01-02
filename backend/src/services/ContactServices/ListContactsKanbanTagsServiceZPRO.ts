import { QueryTypes } from 'sequelize';
import db from '../../database/index';

interface ListContactsParams {
  searchParam?: string;
  pageNumber?: string;
  tenantId: number;
  profile: string;
  userId: number;
}

interface Contact {
  id: number;
  name: string;
  number: string;
  email: string;
  profilePicUrl: string;
  createdAt: Date;
  updatedAt: Date;
  tenantId: number;
  isGroup: boolean;
  isUser: boolean;
  isWAContact: boolean;
  tags: Tag[];
}

interface Tag {
  id: number;
  name: string;
  color: string;
}

interface ListContactsResponse {
  contacts: Contact[];
  count: number;
  hasMore: boolean;
}

const ListContactsService = async ({
  searchParam = '',
  pageNumber = '1',
  tenantId,
  profile,
  userId
}: ListContactsParams): Promise<ListContactsResponse> => {
  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  // Query base para filtrar por tenant e permissões
  const baseQuery = `
    SELECT "Contact"."id" 
    FROM "Contacts" "Contact"
    WHERE "Contact"."tenantId" = ${tenantId}
    AND (LOWER("Contact"."name") LIKE '%${searchParam.toLowerCase().trim()}%'
    OR ("Contact"."number" LIKE '%${searchParam.toLowerCase().trim()}%'))
    AND ('${profile}' = 'admin' OR "Contact"."userId" = ${userId})
    AND "Contact"."id" is not null
  `;

  // Query principal com joins e campos
  const mainQuery = `
    SELECT DISTINCT 
      "Contact"."id",
      "Contact"."name",
      "Contact"."number",
      "Contact"."email",
      "Contact"."profilePicUrl",
      "Contact"."createdAt",
      "Contact"."updatedAt",
      "Contact"."tenantId",
      "Contact"."isGroup",
      "Contact"."isUser",
      "Contact"."isWAContact",
      "Contact"."lastMessageAt",
      "Contact"."birthDay",
      "Contact"."businessHours",
      "Contact"."kanban",
      "Contact"."blocked",
      "Contact"."pushName",
      "Contact"."hubWhatsapp",
      "Contact"."hubTelegram",
      "Contact"."hubInstagram",
      "Contact"."hubTiktok",
      "Contact"."hubTwitter",
      "Contact"."hubMercadolivre",
      "Contact"."hubOlx",
      "Contact"."hubEmail",
      "Contact"."hubSms",
      "Contact"."hubIfood",
      "Contact"."hubWidget",
      array_agg(json_build_object(
        'tagid', "Tags"."id",
        'tag', "Tags"."name",
        'color', "Tags"."color"
      )) filter (where "Tags"."id" is not null) as "tags",
      "u"."name" as "userName",
      "cw"."wallet" as "wallet"
    FROM "Contacts" "Contact"
    LEFT JOIN "ContactTags" ct ON "Contact"."id" = ct."contactId"
    LEFT JOIN "Tags" ON "Tags"."id" = ct."tagId"
    LEFT JOIN "Users" u ON cw."userId" = u."id"
    LEFT JOIN "ContactWallets" cw ON cw."contactId" = "Contact"."id"
    WHERE "Contact"."tenantId" = ${tenantId}
    AND (LOWER("Contact"."name") LIKE '%${searchParam.toLowerCase().trim()}%'
    OR ("Contact"."number" LIKE '%${searchParam.toLowerCase().trim()}%'))
    AND ('${profile}' = 'admin' OR "Contact"."userId" = ${userId})
    GROUP BY "Contact"."id", "u"."name", "cw"."wallet"
    ORDER BY "Contact"."name" ASC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  // Query para contar total de registros
  const countQuery = `
    SELECT count(distinct "Contact"."id")
    FROM "Contacts" "Contact"
    WHERE "Contact"."tenantId" = ${tenantId}
    AND (LOWER("Contact"."name") LIKE '%${searchParam.toLowerCase().trim()}%'
    OR ("Contact"."number" LIKE '%${searchParam.toLowerCase().trim()}%'))
    AND ('${profile}' = 'admin' OR "Contact"."userId" = ${userId})
  `;

  const contacts = await db.query(mainQuery, {
    type: QueryTypes.SELECT
  });

  const countResult = await db.query(countQuery, {
    type: QueryTypes.SELECT
  });

  const count = countResult?.[0]?.count || 0;
  const hasMore = count > offset + contacts.length;

  return {
    contacts,
    count,
    hasMore
  };
};

export default ListContactsService; 