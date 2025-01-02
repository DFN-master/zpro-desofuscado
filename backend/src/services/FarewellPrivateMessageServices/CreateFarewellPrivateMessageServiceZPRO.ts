import AppError from "../../errors/AppErrorZPRO";
import FarewellPrivateMessage from "../../models/FarewellPrivateMessageZPRO";

interface IRequest {
  message: string;
  userId: number;
  tenantId: number;
}

interface IFarewellPrivateMessage {
  message: string;
  userId: number;
  tenantId: number;
}

const CreateFarewellPrivateMessageService = async ({
  message,
  userId,
  tenantId
}: IRequest): Promise<IFarewellPrivateMessage> => {
  // Verifica se já existe uma mensagem de despedida privada
  const farewellMessageExists = await FarewellPrivateMessage.findOne({
    where: {
      message,
      userId,
      tenantId
    }
  });

  if (farewellMessageExists) {
    throw new AppError("ERR_FAREWELL_PRIVATE_MESSAGE_DUPLICATED");
  }

  // Cria uma nova mensagem de despedida privada
  const farewellMessage = await FarewellPrivateMessage.create({
    message,
    userId,
    tenantId
  });

  return farewellMessage;
};

export default CreateFarewellPrivateMessageService; 