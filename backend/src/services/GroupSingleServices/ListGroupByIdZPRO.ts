import { Request } from "express";
import AppError from "../../errors/AppError";
import GetTicketWbotById from "../../helpers/GetTicketWbotById";
import { getWbotBaileys } from "../../libs/wbot-baileys";
import Whatsapp from "../../models/Whatsapp";
import { getGroupMetadataCache } from "../../utils/groupsZPRO";

interface Request {
  whatsappId: number;
  groupId: string;
}

const ListGroupById = async ({ whatsappId, groupId }: Request): Promise<any> => {
  const whatsapp = await Whatsapp.findOne({
    where: { id: whatsappId }
  });

  if (whatsapp?.type === "baileys") {
    const wbot = await getWbotBaileys(whatsappId);
    
    try {
      const groupData = await getGroupMetadataCache(wbot, groupId);
      return groupData;
    } catch (err) {
      console.log(err);
      throw new AppError("ERR_LIST_WHATSAPP_GROUP_BAILEYS");
    }
  } else {
    const wbot = await GetTicketWbotById(whatsappId);
    
    try {
      const groupData = await wbot.getContactById(groupId);
      return groupData;
    } catch (err) {
      console.log(err);
      throw new AppError("ERR_LIST_WHATSAPP_GROUPBYID");
    }
  }
};

export default ListGroupById; 