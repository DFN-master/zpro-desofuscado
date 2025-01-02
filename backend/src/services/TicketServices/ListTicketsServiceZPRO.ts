import { QueryTypes } from "sequelize";
import { subDays, startOfDay } from "date-fns";
import TicketZPRO from "../../models/TicketZPRO";
import UsersQueuesZPRO from "../../models/UsersQueuesZPRO";
import AppErrorZPRO from "../../errors/AppErrorZPRO";
import QueueZPRO from "../../models/QueueZPRO";
import SettingZPRO from "../../models/SettingZPRO";
import TenantZPRO from "../../models/TenantZPRO";

interface Request {
  searchParam?: string;
  pageNumber?: string;
  status?: string[];
  date?: string;
  showAll?: boolean;
  userId: number;
  withUnreadMessages?: string;
  queuesIds?: number[];
  isNotAssignedUser?: string;
  includeNotQueueDefined?: boolean;
  tenantId: number;
  profile: string;
}

interface Response {
  tickets: any[];
  count: number;
  hasMore: boolean;
}

const ListTicketsService = async ({
  searchParam = "",
  pageNumber = "1",
  status,
  date,
  showAll,
  userId,
  withUnreadMessages,
  queuesIds,
  isNotAssignedUser,
  includeNotQueueDefined,
  tenantId,
  profile
}: Request): Promise<Response> => {
  const settingTicketLimit = await SettingZPRO.findOne({
    where: { key: "ticketLimit", tenantId }
  });

  const settingTicketLimitDays = await SettingZPRO.findOne({
    where: { key: "ticketLimitDays", tenantId }
  });

  const tenant = await TenantZPRO.findOne({
    where: { id: tenantId }
  });

  const limitDays = settingTicketLimitDays?.value ? parseInt(settingTicketLimitDays.value) : 0;
  const dateStart = startOfDay(subDays(new Date(), limitDays));
  
  const userProfile = profile === "admin" || profile === "supervisor" ? "S" : "N";
  const showAllTickets = showAll === "true" && (profile === "admin" || profile === "supervisor");
  const withUnread = withUnreadMessages && withUnreadMessages === "true" ? "S" : "N";
  const notAssigned = isNotAssignedUser && isNotAssignedUser === "true" ? "S" : "N";
  const showAllParam = showAllTickets ? "S" : "N";
  const queueFilter = queuesIds ? "S" : "N";
  const searchFilter = searchParam ? "S" : "N";

  if (!status && !showAllTickets) {
    throw new AppErrorZPRO("ERR_NO_STATUS_SELECTED", 403);
  }

  if (showAllTickets) {
    status = ["open", "pending", "closed"];
  }

  let extraWhereClause = "";
  let nullTicketFilter = "";

  if (settingTicketLimit?.value === "enabled") {
    extraWhereClause = `
      AND (
        t."queueId" in ( select w.id from "Whatsapps" w where w."tenantId" = :tenantId )
        OR t."userId" = :userId
      )
    `;
  }

  if (String(tenant?.nullTickets) === "enabled") {
    nullTicketFilter = `
      AND (
        exists (
          select 1 from "Contacts" c where c.id = t."contactId" AND c."tenantId" = :tenantId
        )
      )
    `;
  }

  const userQueues = await UsersQueuesZPRO.findAll({
    where: { userId }
  });

  let queuesIdsUser = userQueues.map(userQueue => userQueue.queueId);

  if (queuesIds) {
    const newQueuesIds: number[] = [];
    queuesIds.forEach(queueId => {
      const queueIndex = queuesIdsUser.indexOf(+queueId);
      if (queueIndex >= 0) {
        newQueuesIds.push(+queueId);
      }
    });
    queuesIdsUser = newQueuesIds.length ? newQueuesIds : [-1];
  }

  if (!queuesIdsUser.length) {
    queuesIdsUser = [-1];
  }

  const hasQueueFilter = (await QueueZPRO.count({ where: { tenantId } })) > 0 ? "S" : "N";

  const sqlQuery = `
    SELECT DISTINCT 
      t.*,
      c."profilePicUrl",
      c."name",
      q.queue,
      c."kanbanStatus",
      u."name" as username,
      COALESCE(
        jsonb_build_object(
          'id', w.id,
          'name', w."name"
        ),
        '{}'
      ) as tags
    FROM "Tickets" t
    INNER JOIN "Contacts" c ON (t."contactId" = c.id)
    LEFT JOIN "Users" u ON (u.id = t."userId")
    LEFT JOIN "Whatsapps" w ON (w.id = t."whatsappId")
    LEFT JOIN "ContactWallets" cw ON (cw."walletId" = t."contactId")
    LEFT JOIN "Queues" q ON (t."queueId" = q.id)
    LEFT JOIN "Tags" tags ON (ct."tagId" = tags.id)
    WHERE t."tenantId" = :tenantId
    ${extraWhereClause}
    ${nullTicketFilter}
    AND (
      (:isQueuesIds = 'S' AND t."queueId" in (:queuesIdsUser))
      OR (:isAdmin = 'S' AND t.status in (:status))
      OR (
        :isShowAll = 'N' 
        AND t.status in (:status)
        AND (
          (t."queueId" in (:queuesIdsUser) AND t.status = 'pending')
          OR t."userId" = :userId
        )
      )
    )
    AND (
      (:isUnread = 'S' AND t."unreadMessages" > 0)
      OR :isUnread = 'N'
    )
    AND (
      (:isNotAssigned = 'S' AND t."userId" IS NULL)
      OR :isNotAssigned = 'N'
    )
    AND (
      (:isSearchParam = 'S' AND (
        upper(c."name") LIKE upper(:searchParam)
        OR c."number" LIKE :searchParam
        OR upper(t.body) LIKE upper(:searchParam)
      ))
      OR :isSearchParam = 'N'
    )
    AND (t."updatedAt" >= :limitDaysAgo OR t."createdAt" >= :limitDaysAgo)
    ORDER BY t."updatedAt" DESC
    LIMIT :limit 
    OFFSET :offset
  `;

  const limit = tenant?.ticketLimit || 30;
  const offset = limit * (+pageNumber - 1);

  const tickets = await TicketZPRO.sequelize?.query(sqlQuery, {
    replacements: {
      tenantId,
      isQueuesIds: queueFilter,
      isAdmin: userProfile,
      status,
      limitDaysAgo: dateStart,
      isShowAll: showAllParam,
      isExistsQueue: hasQueueFilter,
      queuesIdsUser,
      userId,
      isUnread: withUnread,
      isNotAssigned: notAssigned,
      isSearchParam: searchFilter,
      searchParam: `%${searchParam}%`,
      limit,
      offset
    },
    type: QueryTypes.SELECT,
    nest: true
  });

  let count = 0;
  let ticketCount = 0;

  if (tickets?.length) {
    count = tickets[0].count;
    ticketCount = tickets.length;
  }

  const hasMore = count > offset + ticketCount;

  return {
    tickets: tickets || [],
    count,
    hasMore
  };
};

export default ListTicketsService; 