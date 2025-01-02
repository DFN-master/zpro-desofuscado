import { promisify } from 'util';
import { writeFile } from 'fs';
import ChatFlowZPRO from '../../models/ChatFlowZPRO';
import AppErrorZPRO from '../../errors/AppErrorZPRO';

const writeFileAsync = promisify(writeFile);

interface DeleteChatFlowRequest {
  id: number;
  tenantId: number;
}

const DeleteChatFlowService = async ({
  id,
  tenantId
}: DeleteChatFlowRequest): Promise<void> => {
  const errorMessages = {
    NOT_FOUND: 'ERR_NO_CHAT_FLOW_FOUND',
    IS_ACTIVE: 'isActive',
    IS_DELETED: 'isDeleted'
  };

  const chatFlow = await ChatFlowZPRO.findOne({
    where: {
      id,
      tenantId
    }
  });

  if (!chatFlow) {
    throw new AppErrorZPRO(errorMessages.NOT_FOUND, 404);
  }

  // Atualiza o status do fluxo de chat
  await chatFlow.update({
    isActive: false,
    isDeleted: true
  });

  // Recarrega os atributos específicos
  await chatFlow.reload({
    attributes: [errorMessages.IS_ACTIVE, errorMessages.IS_DELETED]
  });

  // Destrói o registro
  await chatFlow.destroy();
};

export default DeleteChatFlowService; 