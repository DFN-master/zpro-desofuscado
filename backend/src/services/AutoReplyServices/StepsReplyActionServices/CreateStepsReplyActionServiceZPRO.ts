import StepsReplyActionZPRO from '../../../models/StepsReplyActionZPRO';

interface CreateStepsReplyActionData {
  stepReplyId: number;
  words: string;
  action: string;
  userId: number;
  queueId: number;
  userIdDestination: number;
  nextStepId: number;
  replyDefinition: string;
}

const CreateStepsReplyActionService = async ({
  stepReplyId,
  words,
  action,
  userId,
  queueId,
  userIdDestination,
  nextStepId,
  replyDefinition
}: CreateStepsReplyActionData): Promise<StepsReplyActionZPRO> => {
  
  const stepsReplyAction = await StepsReplyActionZPRO.create({
    stepReplyId,
    words,
    action,
    userId,
    queueId, 
    userIdDestination,
    nextStepId,
    replyDefinition
  });

  return stepsReplyAction;
};

export default CreateStepsReplyActionService; 