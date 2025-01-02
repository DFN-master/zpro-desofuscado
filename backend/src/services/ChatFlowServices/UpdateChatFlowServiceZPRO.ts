import { promisify } from "util";
import path from "path";
import fs from "fs";
import ChatFlowZPRO from "../../models/ChatFlowZPRO";
import AppErrorZPRO from "../../errors/AppErrorZPRO";

const writeFileAsync = promisify(fs.writeFile);

interface ChatFlowData {
  name: string;
  flow: {
    nodeList: Array<{
      type: string;
      interactions?: Array<{
        type: string;
        attributes?: {
          name?: string;
          mediaUrl?: string;
          base64?: string;
        };
      }>;
    }>;
    isActive?: boolean;
  };
  userId: string;
  isActive: boolean;
  celularTeste?: string;
}

interface UpdateChatFlowRequest {
  chatFlowData: ChatFlowData;
  chatFlowId: string;
  tenantId: string;
}

const UpdateChatFlowService = async ({
  chatFlowData,
  chatFlowId,
  tenantId
}: UpdateChatFlowRequest) => {
  const { name, flow, userId, isActive, celularTeste } = chatFlowData;

  // Busca o fluxo de chat existente
  const chatFlow = await ChatFlowZPRO.findOne({
    where: { id: chatFlowId, tenantId },
    attributes: ["id", "name", "flow", "userId", "isActive", "celularTeste"]
  });

  if (!chatFlow) {
    throw new AppErrorZPRO("ERR_NO_CHAT_FLOW_FOUND", 404);
  }

  // Processa os nós do fluxo
  for (const node of flow.nodeList) {
    if (node.type === "media") {
      // Processa interações de mídia
      for (const interaction of node.interactions || []) {
        if (interaction.type === "MediaField" && interaction.attributes?.base64) {
          // Gera nome único para o arquivo
          const fileName = `${new Date().getTime()}-${interaction.attributes.name}`;
          
          // Salva o arquivo de mídia
          await writeFileAsync(
            path.join(__dirname, "..", "..", "..", "public", tenantId.toString(), fileName),
            interaction.attributes.base64.split("base64,")[1],
            "base64"
          );

          // Remove base64 e atualiza URL da mídia
          delete interaction.attributes.base64;
          interaction.attributes.mediaUrl = fileName;
        }

        // Atualiza nome do arquivo de mídia se necessário
        if (interaction.type === "MediaField" && interaction.attributes?.mediaUrl) {
          const urlParts = interaction.attributes.mediaUrl.split("/");
          interaction.attributes.mediaUrl = urlParts[urlParts.length - 1];
        }
      }
    }
  }

  // Atualiza o fluxo de chat
  await chatFlow.update({
    name,
    flow: flow.nodeList,
    userId,
    isActive: flow.isActive,
    celularTeste
  });

  // Recarrega os dados atualizados
  await chatFlow.reload({
    attributes: ["id", "name", "flow", "userId", "isActive", "celularTeste"]
  });

  return chatFlow;
};

export default UpdateChatFlowService; 