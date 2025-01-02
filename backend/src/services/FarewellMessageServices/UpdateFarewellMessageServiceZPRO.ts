import { FarewellMessageZPRO } from '../../models/FarewellMessageZPRO';
import AppErrorZPRO from '../../errors/AppErrorZPRO';

interface IFarewellMessageData {
  groupId: string;
  message: string;
  userId: string;
  tenantId: string;
}

interface IRequest {
  farewellMessageData: IFarewellMessageData;
  farewellMessageId: string;
}

const UpdateFarewellMessageService = async ({
  farewellMessageData,
  farewellMessageId
}: IRequest): Promise<FarewellMessageZPRO> => {
  const { groupId, message, userId, tenantId } = farewellMessageData;

  // Busca a mensagem de despedida pelo ID e tenantId
  const farewellMessage = await FarewellMessageZPRO.findOne({
    where: {
      id: farewellMessageId,
      tenantId
    },
    attributes: ['id', 'groupId', 'message', 'userId']
  });

  // Se não encontrar a mensagem, lança erro
  if (!farewellMessage) {
    throw new AppErrorZPRO('ERR_NO_FAREWELL_MESSAGE_FOUND', 404);
  }

  // Atualiza os dados da mensagem
  await farewellMessage.update({
    groupId,
    message, 
    userId
  });

  // Recarrega o registro para retornar dados atualizados
  await farewellMessage.reload({
    attributes: ['id', 'groupId', 'message', 'userId']
  });

  return farewellMessage;
};

export default UpdateFarewellMessageService; 