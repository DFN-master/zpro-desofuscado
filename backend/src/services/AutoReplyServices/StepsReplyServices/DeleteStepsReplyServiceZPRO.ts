import { StepsReplyZPRO } from '../../../models/StepsReplyZPRO';
import AppErrorZPRO from '../../../errors/AppErrorZPRO';

interface DeleteParams {
  id: number;
}

const DeleteStepsReplyService = async ({ id }: DeleteParams): Promise<void> => {
  const stepsReply = await StepsReplyZPRO.findOne({
    where: { id }
  });

  if (!stepsReply) {
    throw new AppErrorZPRO('ERR_NO_STEP_AUTO_REPLY_FOUND', 404);
  }

  await stepsReply.destroy();
};

export default DeleteStepsReplyService; 