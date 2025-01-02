import { MessageMedia } from 'whatsapp-web.js';
import { getWbotBaileys } from '../wbot-baileysZPRO';
import AppError from '../../errors/AppErrorZPRO';
import GetTicketWbotById from '../../helpers/GetTicketWbotByIdZPRO';
import { logger } from '../../utils/loggerZPRO';
import GroupChat from 'whatsapp-web.js/src/structures/GroupChat';
import Whatsapp from '../../models/WhatsappZPRO';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

interface ChangeGroupPictureData {
  picture: string;
  whatsappId: number;
  groupId: string;
}

const ChangeGroupPicture = async ({
  picture,
  whatsappId,
  groupId
}: ChangeGroupPictureData): Promise<void> => {
  const whatsapp = await Whatsapp.findOne({
    where: { id: whatsappId }
  });

  if (whatsapp?.type === "baileys") {
    const wbot = await getWbotBaileys(whatsappId);

    try {
      const mediaPath = path.join(__dirname, "../../public", whatsapp.tenantId.toString());
      
      const response = await axios({
        method: "GET",
        url: picture,
        responseType: "stream"
      });

      const mimeType = response.headers["content-type"];
      const fileExtension = mimeType.split("/")[1];

      if (!fileExtension) {
        throw new Error("Could not determine the file extension from the mime type");
      }

      const filePath = path.join(
        mediaPath,
        `${new Date().getTime()}.${fileExtension}`
      );

      response.data.pipe(fs.createWriteStream(filePath));

      response.data.on("end", () => {
        logger.info("Z-PRO ::: ZDG ::: download complete");
      });

      await wbot.updateProfilePicture(groupId, { url: filePath });
      
      fs.unlinkSync(filePath);

    } catch (err) {
      logger.error(`Z-PRO ::: ZDG ::: ERR_CHANGING_PICTURE_WAPP_GROUP: ${err}`);
      throw new AppError("ERR_CHANGING_PICTURE_WAPP_GROUP");
    }

  } else {
    const wbot = await GetTicketWbotById(whatsappId);

    try {
      let media = await MessageMedia.fromUrl(picture);
      const chat = await wbot.getChatById(groupId);

      if (chat instanceof GroupChat) {
        await chat.setPicture(media);
      } else {
        throw new AppError("ERR_CHANGING_PICTURE_WAPP_GROUP");
      }

    } catch (err) {
      logger.error(`Z-PRO ::: ZDG ::: ERR_CHANGING_PICTURE_WAPP_GROUP: ${err}`);
      throw new AppError("ERR_CHANGING_PICTURE_WAPP_GROUP");
    }
  }
};

export default ChangeGroupPicture; 