import { FarewellPrivateMessageZPRO } from '../../models/FarewellPrivateMessageZPRO';
import AppErrorZPRO from '../../errors/AppErrorZPRO';

interface IRequest {
  farewellPrivateMessageData: {
    message: string;
    userId: number;
    tenantId: number;
  };
  farewellPrivateMessageId: number;
}

interface IFarewellPrivateMessageAttributes {
  id: number;
  message: string;
  userId: number;
  tenantId: number;
  createdAt: Date;
  updatedAt: Date;
}

const UpdateFarewellPrivateMessageService = async ({
  farewellPrivateMessageData,
  farewellPrivateMessageId
}: IRequest): Promise<IFarewellPrivateMessageAttributes> => {
  const { message, userId, tenantId } = farewellPrivateMessageData;

  // Busca a mensagem de despedida privada existente
  const farewellPrivateMessage = await FarewellPrivateMessageZPRO.findOne({
    where: {
      id: farewellPrivateMessageId,
      tenantId
    },
    attributes: ['id', 'message', 'userId']
  });

  // Verifica se a mensagem existe
  if (!farewellPrivateMessage) {
    throw new AppErrorZPRO(
      'ERR_NO_FAREWELL_PRIVATE_MESSAGE_FOUND',
      404
    );
  }

  // Atualiza os dados da mensagem
  await farewellPrivateMessage.update({
    message,
    userId
  });

  // Recarrega os dados atualizados
  await farewellPrivateMessage.reload({
    attributes: ['id', 'message', 'userId']
  });

  return farewellPrivateMessage;
};

export default UpdateFarewellPrivateMessageService; 