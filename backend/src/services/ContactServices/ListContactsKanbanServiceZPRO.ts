import { QueryTypes } from "sequelize";
import database from "../../database/index";

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
  walletId: number;
  kanban: string;
  blocked: boolean;
  tags: string[];
  hubWhatsapp: boolean;
  hubTelegram: boolean;
  hubSms: boolean;
  hubEmail: boolean;
  hubInstagram: boolean;
  hubTiktok: boolean;
  hubMercadolivre: boolean;
  hubOlx: boolean;
  hubIfood: boolean;
  hubWebchat: boolean;
  hubYoutube: boolean;
  hubTwitter: boolean;
  hubLikedin: boolean;
  hubWidget: boolean;
}

interface ListContactsResponse {
  contacts: Contact[];
  count: number;
  hasMore: boolean;
}

const ListContactsService = async ({
  searchParam = "",
  pageNumber = "1",
  tenantId,
  profile,
  userId
}: ListContactsParams): Promise<ListContactsResponse> => {
  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  // Filtro base para pesquisa
  const baseFilter = `
    "Contact"."tenantId" = ${tenantId}
    and ("Contact"."kanban" is not null)
    and (LOWER("Contact"."name") like '%${searchParam.toLowerCase().trim()}%'
    or LOWER("Contact"."number") like '%${searchParam.toLowerCase().trim()}%')
    and ('${profile}' = 'admin'
    or "u"."id" = ${userId})
  `;

  // Query para contar total de registros
  const countQuery = `
    SELECT count(*) 
    FROM "Contacts" as "Contact"
    LEFT JOIN "Users" u ON "Contact"."tenantId" = "u"."tenantId"
    WHERE ${baseFilter}
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
      "Contact"."tenantId",
      "Contact"."isGroup",
      "Contact"."isUser",
      "Contact"."isWAContact",
      "Contact"."kanban",
      "Contact"."blocked",
      array_agg(
        json_build_object(
          'tagid', "Tags"."id",
          'tag', "Tags"."tag",
          'color', "Tags"."color"
        )
      ) filter (where "Tags"."id" is not null) as "tags",
      "Contact"."hubWhatsapp",
      "Contact"."hubTelegram", 
      "Contact"."hubSms",
      "Contact"."hubEmail",
      "Contact"."hubInstagram",
      "Contact"."hubTiktok",
      "Contact"."hubMercadolivre",
      "Contact"."hubOlx",
      "Contact"."hubIfood",
      "Contact"."hubWebchat",
      "Contact"."hubYoutube",
      "Contact"."hubTwitter",
      "Contact"."hubLikedin",
      "Contact"."hubWidget",
      cw."walletId",
      "u"."name" as "wallet"
    FROM "Contacts" as "Contact"
    LEFT JOIN "Users" u ON "Contact"."tenantId" = "u"."tenantId"
    LEFT JOIN "ContactTags" ct ON "Contact"."id" = ct."contactId"
    LEFT JOIN "Tags" ON ct."tagId" = "Tags"."id"
    LEFT JOIN "ContactWallets" cw ON cw."contactId" = "Contact"."id"
    WHERE ${baseFilter}
    GROUP BY "Contact"."id", "u"."name", cw."walletId"
    ORDER BY "Contact"."id" ASC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  const contacts = await database.query(mainQuery, {
    type: QueryTypes.SELECT
  });

  const [{ count }] = await database.query(countQuery, {
    type: QueryTypes.SELECT
  });

  const hasMore = count > offset + contacts.length;

  return {
    contacts,
    count,
    hasMore
  };
};

export default ListContactsService; 