import { QueryTypes } from 'sequelize';
import database from '../../database/index';

interface ListContactsByTagsParams {
  searchParam?: string;
  pageNumber?: string;
  tenantId: number | string;
  profile: string;
  userId: number | string;
}

interface ListContactsByTagsResult {
  contacts: any[];
  count: number;
  hasMore: boolean;
}

const ListContactsByTagsService = async ({
  searchParam = '',
  pageNumber = '1',
  tenantId,
  profile,
  userId
}: ListContactsByTagsParams): Promise<ListContactsByTagsResult> => {
  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  // Query para filtrar contatos por condições específicas
  const whereCondition = `
    "Contact"."tenantId" = ${tenantId}
    and (LOWER("Contact"."name") like '%${searchParam.toLowerCase().trim()}%' 
    or "Contact"."number" like '%${searchParam.toLowerCase().trim()}%')
    and ('${profile}' = 'admin' or ("u"."id" is not null))
    and ${userId} in "Users"."id"
    and ("cw"."walletId" is null)
  `;

  // Query para contar total de registros
  const countQuery = `
    SELECT count(distinct "Contact"."id") as count
    from "Contacts" "Contact"
    left join "ContactTags" ct on "Contact"."id" = ct."contactId"
    left join "Tags" "Tags" on "Tags"."id" = ct."tagId"
    left join "ContactWallets" cw on cw."contactId" = "Contact"."id"
    left join "Users" u on cw."walletId" = u."id"
    where ${whereCondition}
  `;

  // Query principal para buscar contatos
  const query = `
    SELECT
      "Contact"."id",
      "Contact"."name" as "ContactName",
      "Contact"."number",
      "Contact"."email",
      "Contact"."profilePicUrl",
      "Contact"."createdAt",
      "Contact"."updatedAt",
      "Contact"."pushname",
      "Contact"."tenantId",
      "Contact"."isUser",
      "Contact"."isWAContact",
      "Contact"."isGroup",
      "Contact"."telegramId",
      "Contact"."messenger",
      "Contact"."instagramPK",
      "Contact"."birthDay",
      "Contact"."businessName",
      "Contact"."blocked",
      "Contact"."kanban",
      "Contact"."hubTelegram",
      "Contact"."hubWhatsapp",
      "Contact"."hubInstagram",
      "Contact"."hubTwitter",
      "Contact"."hubFacebook",
      "Contact"."hubTiktok",
      "Contact"."hubYoutube",
      "Contact"."hubLinkedin",
      "Contact"."hubMercadolivre",
      "Contact"."hubOlx",
      "Contact"."hubEmail",
      "Contact"."hubSms",
      "Contact"."hubIfood",
      array_agg(json_build_object('tag', 'color', "Tags"."tag", "Tags"."color")) as "tags"
    from "Contacts" "Contact"
    left join "ContactTags" ct on "Contact"."id" = ct."contactId"
    left join "Tags" "Tags" on "Tags"."id" = ct."tagId"
    left join "ContactWallets" cw on cw."contactId" = "Contact"."id"
    left join "Users" u on cw."walletId" = u."id"
    where ${whereCondition}
    group by "Contact"."id"
    order by "Contact"."name" asc
    limit ${limit}
    offset ${offset}
  `;

  const contacts = await database.query(query, {
    type: QueryTypes.SELECT
  });

  const countResult = await database.query(countQuery, {
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

export default ListContactsByTagsService; 