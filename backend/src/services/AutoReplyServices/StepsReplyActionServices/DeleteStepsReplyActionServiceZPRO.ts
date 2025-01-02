import { StepsReplyAction } from '../../../models/StepsReplyActionZPRO';
import AppError from '../../../errors/AppErrorZPRO';

interface DeleteStepsReplyActionRequest {
  id: number;
}

const DeleteStepsReplyActionService = async ({ 
  id 
}: DeleteStepsReplyActionRequest): Promise<void> => {
  const stepsReplyAction = await StepsReplyAction.findOne({
    where: { id }
  });

  if (!stepsReplyAction) {
    throw new AppError('ERR_NO_STEPS_REPLY_FOUND', 404);
  }

  await stepsReplyAction.destroy();
};

export default DeleteStepsReplyActionService; 