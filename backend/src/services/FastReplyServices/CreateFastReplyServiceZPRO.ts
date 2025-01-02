import { FastReplyZPRO } from "../../models/FastReplyZPRO";

interface CreateFastReplyData {
  key: string;
  message: string;
  media?: string;
  voice?: string;
  userId: number;
  tenantId: number;
}

const CreateFastReplyService = async ({
  key,
  message,
  media,
  voice,
  userId,
  tenantId
}: CreateFastReplyData): Promise<FastReplyZPRO> => {
  const fastReply = await FastReplyZPRO.create({
    key,
    message,
    media,
    voice,
    userId,
    tenantId
  });

  return fastReply;
};

export default CreateFastReplyService; 