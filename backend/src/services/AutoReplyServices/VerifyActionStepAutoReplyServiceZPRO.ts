import { fn, col, Op } from 'sequelize';
import AutoReplyZPRO from '../../models/AutoReplyZPRO';
import StepsReplyZPRO from '../../models/StepsReplyZPRO';
import StepsReplyActionZPRO from '../../models/StepsReplyActionZPRO';

interface VerifyActionStepAutoReplyParams {
  stepReplyId: number;
  message: string;
  tenantId: number;
}

const VerifyActionStepAutoReplyService = async ({
  stepReplyId,
  message,
  tenantId
}: VerifyActionStepAutoReplyParams) => {
  if (!message) {
    return null;
  }

  const stepsReplyAction = await StepsReplyActionZPRO.findOne({
    where: {
      stepReplyId,
      words: fn('LOWER', col('words')), fn('LOWER', message)
    },
    include: [
      {
        model: StepsReplyZPRO,
        as: 'stepsReply',
        include: [
          {
            model: AutoReplyZPRO,
            as: 'autoReply',
            where: { tenantId }
          }
        ]
      }
    ]
  });

  return stepsReplyAction;
};

export default VerifyActionStepAutoReplyService; 