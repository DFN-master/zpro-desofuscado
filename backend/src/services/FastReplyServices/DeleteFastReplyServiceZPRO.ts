import AppError from "../../errors/AppError";
import FastReply from "../../models/FastReplyZPRO";

interface DeleteFastReplyRequest {
  id: number;
  tenantId: number;
}

const DeleteFastReplyService = async ({
  id,
  tenantId
}: DeleteFastReplyRequest): Promise<void> => {
  const fastReply = await FastReply.findOne({
    where: {
      id,
      tenantId
    }
  });

  if (!fastReply) {
    throw new AppError("ERR_FAST_REPLY_NOT_FOUND", 404);
  }

  try {
    await fastReply.destroy();
  } catch (err) {
    throw new AppError("ERR_FAST_REPLY_EXISTS", 500);
  }
};

export default DeleteFastReplyService; 