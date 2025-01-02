import AppError from '../../../errors/AppErrorZPRO';
import StepsReplyAction from '../../../models/StepsReplyActionZPRO';

interface IUpdateStepsReplyActionData {
  stepReplyId: number;
  words: string;
  action: string;
  userId: number;
  queueId: number;
  userIdDestination: number;
  nextStepId: number;
  replyDefinition: string;
}

interface IRequest {
  stepsReplyActionData: IUpdateStepsReplyActionData;
  stepsReplyActionId: number;
}

const UpdateStepsReplyActionService = async ({
  stepsReplyActionData,
  stepsReplyActionId
}: IRequest): Promise<StepsReplyAction> => {
  const {
    stepReplyId,
    words,
    action,
    userId,
    queueId,
    userIdDestination,
    nextStepId,
    replyDefinition
  } = stepsReplyActionData;

  const stepsReplyAction = await StepsReplyAction.findOne({
    where: { id: stepsReplyActionId },
    attributes: [
      'id',
      'stepReplyId',
      'words',
      'action',
      'userId',
      'queueId',
      'userIdDestination',
      'nextStepId',
      'replyDefinition'
    ]
  });

  if (!stepsReplyAction) {
    throw new AppError('ERR_NO_STEP_AUTO_REPLY_FOUND', 404);
  }

  await stepsReplyAction.update({
    stepReplyId,
    words,
    action,
    userId,
    queueId,
    userIdDestination,
    nextStepId,
    replyDefinition
  });

  await stepsReplyAction.reload({
    attributes: [
      'id',
      'stepReplyId', 
      'words',
      'action',
      'userId',
      'queueId',
      'userIdDestination',
      'nextStepId',
      'replyDefinition'
    ]
  });

  return stepsReplyAction;
};

export default UpdateStepsReplyActionService; 