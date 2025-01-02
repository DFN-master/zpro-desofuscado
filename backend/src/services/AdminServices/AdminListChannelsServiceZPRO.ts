import { WhatsappZPRO } from "../../models/WhatsappZPRO";
import { TenantZPRO } from "../../models/TenantZPRO";

interface Request {
  tenantId?: number;
}

interface WhatsappChannel {
  id: number;
  name: string;
  tenant?: TenantZPRO;
}

const AdminListChannelsService = async ({
  tenantId
}: Request): Promise<WhatsappChannel[]> => {
  const whereCondition = {};
  
  if (tenantId) {
    Object.assign(whereCondition, { tenantId });
  }

  const channels = await WhatsappZPRO.findAll({
    where: whereCondition,
    include: [
      {
        model: TenantZPRO,
        as: "tenant",
        attributes: ["id", "name"]
      }
    ]
  });

  return channels;
};

export default AdminListChannelsService; 