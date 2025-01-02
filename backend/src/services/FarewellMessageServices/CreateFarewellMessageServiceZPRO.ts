import AppError from '../../errors/AppErrorZPRO';
import FarewellMessage from '../../models/FarewellMessageZPRO';

interface IRequest {
  groupId: string;
  message: string;
  userId: string;
  tenantId: string;
}

interface IFarewellMessage {
  id: string;
  groupId: string;
  message: string;
  userId: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

const CreateFarewellMessageService = async ({
  groupId,
  message,
  userId,
  tenantId
}: IRequest): Promise<IFarewellMessage> => {
  // Verifica se já existe uma mensagem de despedida para este grupo
  const farewellMessageExists = await FarewellMessage.findOne({
    where: {
      groupId,
      message,
      userId,
      tenantId
    }
  });

  if (farewellMessageExists) {
    throw new AppError('ERR_FAREWELL_MESSAGE_DUPLICATE');
  }

  // Cria uma nova mensagem de despedida
  const farewellMessage = await FarewellMessage.create({
    groupId,
    message,
    userId,
    tenantId
  });

  return farewellMessage;
};

export default CreateFarewellMessageService; 