import { QueryTypes } from "sequelize";
import Database from "../../database/index";

interface Contact {
  id: number;
  name: string;
  number: string;
  email: string;
  profilePicUrl: string;
  createdAt: Date;
  updatedAt: Date;
  firstName: string;
  lastName: string;
  businessName: string;
  cpf: string;
  telegramId: string;
  instagramPk: string;
  birthDay: Date;
  isGroup: boolean;
  isUser: boolean;
  isWAContact: boolean;
  isBlocked: boolean;
  kanban: string;
  hubWhatsapp: boolean;
  hubTelegram: boolean;
  hubInstagram: boolean;
  hubTwitter: boolean;
  hubTiktok: boolean;
  hubMessenger: boolean;
  hubWebchat: boolean;
  hubEmail: boolean;
  hubLikedin: boolean;
  hubYoutube: boolean;
  hubMercadolivre: boolean;
  hubOlx: boolean;
  hubIfood: boolean;
  pushSubscription: boolean;
  tenantId: number;
}

interface ListContactsFilter {
  searchParam?: string;
  pageNumber?: string | number;
  tenantId: number;
  profile?: string;
  userId?: number;
  walletId?: number;
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
  userId,
  walletId
}: ListContactsFilter): Promise<ListContactsResponse> => {
  
  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  // Query base para filtrar contatos
  const whereCondition = `
    "Contact"."tenantId" = ${tenantId}
    and ((LOWER("Contact"."name") like '%${searchParam.toLowerCase().trim()}%')
    or (LOWER("Contact"."number") like '%${searchParam.toLowerCase().trim()}%')
    or (LOWER("Contact"."email") like '%${searchParam.toLowerCase().trim()}%')
    or (LOWER("Contact"."firstName") like '%${searchParam.toLowerCase().trim()}%')
    or (LOWER("Contact"."lastName") like '%${searchParam.toLowerCase().trim()}%')
    or (LOWER("Contact"."businessName") like '%${searchParam.toLowerCase().trim()}%'))
    and "Contact"."profile" = '${profile}'
    and "Contact"."userId" = ${userId}
    ${walletId ? `and "Contact"."walletId" = ${walletId}` : ''}
  `;

  // Query para contar total de registros
  const countQuery = `
    SELECT count(*)
    FROM "Contacts" "Contact"
    WHERE ${whereCondition}
  `;

  // Query principal para buscar contatos
  const mainQuery = `
    SELECT 
      "Contact"."id",
      "Contact"."name",
      "Contact"."number",
      "Contact"."email",
      "Contact"."profilePicUrl",
      "Contact"."createdAt",
      "Contact"."updatedAt",
      "Contact"."firstName",
      "Contact"."lastName", 
      "Contact"."businessName",
      "Contact"."cpf",
      "Contact"."telegramId",
      "Contact"."instagramPk",
      "Contact"."birthDay",
      "Contact"."isGroup",
      "Contact"."isUser",
      "Contact"."isWAContact",
      "Contact"."isBlocked",
      "Contact"."kanban",
      "Contact"."hubWhatsapp",
      "Contact"."hubTelegram", 
      "Contact"."hubInstagram",
      "Contact"."hubTwitter",
      "Contact"."hubTiktok",
      "Contact"."hubMessenger",
      "Contact"."hubWebchat",
      "Contact"."hubEmail",
      "Contact"."hubLikedin",
      "Contact"."hubYoutube",
      "Contact"."hubMercadolivre",
      "Contact"."hubOlx",
      "Contact"."hubIfood",
      "Contact"."pushSubscription",
      "Contact"."tenantId",
      array_agg(json_build_object('tag', "Tags"."tag", 'color', "Tags"."color")) as "tags"
    FROM "Contacts" "Contact"
    LEFT JOIN "ContactTags" ct ON "Contact"."id" = ct."contactId"
    LEFT JOIN "Tags" ON "Tags"."id" = ct."tagId"
    LEFT JOIN "ContactWallets" cw ON cw."contactId" = "Contact"."id"
    LEFT JOIN "Users" u ON cw."walletId" = u."id"
    WHERE ${whereCondition}
    GROUP BY "Contact"."id"
    ORDER BY "Contact"."name" ASC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  // Executa queries no banco
  const [countResult] = await Database.query(countQuery, {
    type: QueryTypes.SELECT
  });

  const contacts = await Database.query(mainQuery, {
    type: QueryTypes.SELECT
  });

  const count = countResult?.count || 0;
  const hasMore = count > (offset + contacts.length);

  return {
    contacts,
    count,
    hasMore
  };
};

export default ListContactsService; 