import { Baileys } from "../../models/Baileys";
import AppError from "../../errors/AppError";

interface Request {
  whatsappId: string;
}

const ShowBaileysService = async ({ whatsappId }: Request): Promise<Baileys> => {
  const baileysData = await Baileys.findOne({
    where: {
      whatsappId
    }
  });

  if (!baileysData) {
    throw new AppError("ERR_NO_BAILEYS_DATA_FOUND", 404);
  }

  return baileysData;
};

export default ShowBaileysService; 