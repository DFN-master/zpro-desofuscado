import { BaileysZPRO } from "../../models/BaileysZPRO";
import { BaileysSessionsZPRO } from "../../models/BaileysSessionsZPRO";

const DeleteBaileysService = async (whatsappId: string): Promise<void> => {
  // Procura e deleta a sessão do Baileys
  const baileysSession = await BaileysSessionsZPRO.findOne({
    where: { whatsappId }
  });

  if (baileysSession) {
    await baileysSession.destroy();
  }

  // Procura e deleta os dados do Baileys
  const baileys = await BaileysZPRO.findOne({
    where: { whatsappId }
  });

  if (baileys) {
    await baileys.destroy();
  }
};

export default DeleteBaileysService; 