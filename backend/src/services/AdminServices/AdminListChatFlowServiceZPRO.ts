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
  const chatFlow = await ChatFlowZPRO.findAll({
    where: {
      tenantId
    }
  });

  return {
    chatFlow
  };
};

export default ListChatFlowService; 