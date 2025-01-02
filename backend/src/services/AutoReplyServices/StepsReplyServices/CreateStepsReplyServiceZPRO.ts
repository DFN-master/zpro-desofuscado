import StepsReplyZPRO from '../../../models/StepsReplyZPRO';

interface CreateStepsReplyData {
  reply: string;
  idAutoReply: number;
  userId: number;
  initialStep: boolean;
}

const CreateStepsReplyService = async ({
  reply,
  idAutoReply,
  userId,
  initialStep
}: CreateStepsReplyData): Promise<StepsReplyZPRO> => {
  const stepsReply = await StepsReplyZPRO.create({
    reply,
    idAutoReply,
    userId,
    initialStep
  });

  return stepsReply;
};

export default CreateStepsReplyService; 