import AppError from "../../errors/AppErrorZPRO";
import FastReply from "../../models/FastReplyZPRO";

interface IFastReplyData {
  key?: string;
  message?: string;
  media?: string;
  voice?: string;
  userId?: number;
  tenantId?: number;
}

interface IRequest {
  fastReplyData: IFastReplyData;
  fastReplyId: number;
}

const UpdateFastReplyService = async ({
  fastReplyData,
  fastReplyId
}: IRequest): Promise<FastReply> => {
  const { key, message, media, voice, userId, tenantId } = fastReplyData;

  const fastReply = await FastReply.findOne({
    where: { 
      id: fastReplyId,
      tenantId 
    },
    attributes: ["id", "key", "message", "media", "voice", "userId"]
  });

  if (!fastReply) {
    throw new AppError("ERR_NO_FAST_REPLY_FOUND", 404);
  }

  await fastReply.update({
    key,
    message,
    media,
    voice,
    userId
  });

  await fastReply.reload({
    attributes: ["id", "key", "message", "media", "voice", "userId"]
  });

  return fastReply;
};

export default UpdateFastReplyService; 