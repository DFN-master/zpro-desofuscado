import AppError from '../../../errors/AppErrorZPRO';
import StepsReply from '../../../models/StepsReplyZPRO';

interface UpdateStepsReplyData {
  reply: string;
  userId: string;
  initialStep: boolean;
}

interface RequestData {
  stepsReplyData: UpdateStepsReplyData;
  stepsReplyId: number;
}

const UpdateStepsReplyService = async ({
  stepsReplyData,
  stepsReplyId
}: RequestData): Promise<StepsReply> => {
  const { reply, userId, initialStep } = stepsReplyData;

  const stepsReply = await StepsReply.findOne({
    where: { id: stepsReplyId },
    attributes: ['id', 'reply', 'userId', 'initialStep']
  });

  if (!stepsReply) {
    throw new AppError('ERR_NO_STEP_AUTO_REPLY_FOUND', 404);
  }

  await stepsReply.update({
    reply,
    userId,
    initialStep
  });

  await stepsReply.reload({
    attributes: ['id', 'reply', 'userId', 'initialStep']
  });

  return stepsReply;
};

export default UpdateStepsReplyService; 