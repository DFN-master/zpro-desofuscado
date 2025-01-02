import { QueryTypes } from 'sequelize';
import db from '../../database/index';

interface ListContactsBirthdayParams {
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
  birthdayDate: string;
  profilePicUrl: string;
  isGroup: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface PaginatedResponse {
  contacts: Contact[];
  count: number;
  hasMore: boolean;
}

const ListContactsBirthdayService = async ({
  searchParam = '',
  pageNumber = '1',
  tenantId,
  profile,
  userId
}: ListContactsBirthdayParams): Promise<PaginatedResponse> => {
  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  // Query base para filtrar por tenant e parâmetros de busca
  const baseFilterQuery = `
    "Contact"."tenantId" = ${tenantId}
    and ((LOWER("Contact"."name") like '%${searchParam.toLowerCase().trim()}%')
    or (LOWER("Contact"."number") like '%${searchParam.toLowerCase().trim()}%'))
    and ('${profile}' = 'admin' or "u"."id" = ${userId})
    and "Contact"."birthdayDate" is not null
  `;

  // Query para contar total de registros
  const countQuery = `
    SELECT count(*) 
    FROM "Contacts" "Contact"
    LEFT JOIN "ContactWallets" cw on "Contact"."id" = cw."contactId"
    LEFT JOIN "Users" u on cw."walletId" = u."id"
    WHERE ${baseFilterQuery}
  `;

  // Query principal para buscar contatos
  const query = `
    SELECT 
      "Contact"."id",
      "Contact"."name",
      "Contact"."number",
      "Contact"."email",
      "Contact"."profilePicUrl",
      "Contact"."createdAt",
      "Contact"."updatedAt",
      "Contact"."pushName",
      "Contact"."tenantId",
      "Contact"."isGroup",
      "Contact"."lastMessage",
      "Contact"."lastMessageAt",
      "Contact"."businessHours",
      "Contact"."kanban",
      "Contact"."blocked",
      "Contact"."isUser",
      "Contact"."isWAContact",
      "Contact"."pushsubId",
      "Contact"."cpf",
      "Contact"."hubWebchat",
      "Contact"."hubWhatsapp",
      "Contact"."hubTelegram",
      "Contact"."hubInstagram",
      "Contact"."hubMessenger",
      "Contact"."hubTwitter",
      "Contact"."hubTiktok",
      "Contact"."hubYoutube",
      "Contact"."hubMercadolivre",
      "Contact"."hubOlx",
      "Contact"."hubIfood",
      "Contact"."birthdayDate",
      array_agg(json_build_object('tagid', "Tags"."id", 'tag', "Tags"."name", 'color', "Tags"."color")) filter (where "Tags"."id" is not null) as "tags"
    FROM "Contacts" "Contact"
    LEFT JOIN "ContactWallets" cw on "Contact"."id" = cw."contactId"
    LEFT JOIN "Users" u on cw."walletId" = u."id"
    LEFT JOIN "ContactTags" ct on ct."contactId" = "Contact"."id"
    LEFT JOIN "Tags" on "Tags"."id" = ct."tagId"
    WHERE ${baseFilterQuery}
    GROUP BY "Contact"."id"
    ORDER BY "Contact"."name" asc
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  // Executa as queries
  const contacts = await db.query(query, {
    type: QueryTypes.SELECT
  }) as Contact[];

  const [{ count }] = await db.query(countQuery, {
    type: QueryTypes.SELECT
  }) as [{ count: number }];

  const hasMore = count > offset + contacts.length;

  return {
    contacts,
    count: Number(count),
    hasMore
  };
};

export default ListContactsBirthdayService; 