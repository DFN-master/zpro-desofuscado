import { ChatFlowZPRO } from "../../models/ChatFlowZPRO";

interface ListChatFlowRequest {
  tenantId: number;
}

interface ListChatFlowResponse {
  chatFlow: ChatFlowZPRO[];
}

const ListChatFlowService = async ({
  tenantId
}: ListChatFlowRequest): Promise<ListChatFlowResponse> => {
  // Busca todos os chat flows ativos
  const chatFlows = await ChatFlowZPRO.findAll({
    where: {
      tenantId,
      isDeleted: false
    }
  });

  // Busca e remove chat flows marcados como deletados
  const deletedFlows = await ChatFlowZPRO.findAll({
    where: {
      tenantId,
      isDeleted: true
    }
  });

  try {
    // Remove fisicamente os registros marcados como deletados
    for (const flow of deletedFlows) {
      await flow.destroy();
    }
  } catch (error) {
    // Ignora erros na limpeza dos registros deletados
  }

  return {
    chatFlow: chatFlows
  };
};

export default ListChatFlowService; 