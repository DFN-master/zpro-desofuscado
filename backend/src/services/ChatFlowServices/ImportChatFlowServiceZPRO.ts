import { ChatFlow } from '../../models/ChatFlow';
import AppError from '../../errors/AppError';

interface UpdateChatFlowRequest {
  chatFlowData: {
    flow: any; // Você pode definir uma interface específica para o flow
  };
  chatFlowId: number;
  tenantId: number;
}

interface ChatFlowAttributes {
  id: number;
  name: string;
  flow: any;
  userId: number;
  isActive: boolean;
  celularTeste: string;
}

const UpdateChatFlowService = async ({
  chatFlowData,
  chatFlowId,
  tenantId
}: UpdateChatFlowRequest): Promise<ChatFlow> => {
  const chatFlow = await ChatFlow.findOne({
    where: {
      id: chatFlowId,
      tenantId
    },
    attributes: [
      'id',
      'name',
      'flow',
      'userId',
      'isActive',
      'celularTeste'
    ]
  });

  if (!chatFlow) {
    throw new AppError('ERR_NO_CHAT_FLOW_FOUND', 404);
  }

  await chatFlow.update({
    flow: chatFlowData.flow
  });

  await chatFlow.reload({
    attributes: [
      'id',
      'name', 
      'flow',
      'userId',
      'isActive',
      'celularTeste'
    ]
  });

  return chatFlow;
};

export default UpdateChatFlowService; 