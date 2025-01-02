import { Op } from 'sequelize';
import AutoReplyZPRO from '../../models/AutoReplyZPRO';
import StepsReplyZPRO from '../../models/StepsReplyZPRO';
import StepsReplyActionZPRO from '../../models/StepsReplyActionZPRO';

interface ListAutoReplyParams {
  tenantId: number | string;
}

interface AutoReplyResponse {
  autoReply: AutoReplyZPRO[];
}

const ListAutoReplyService = async ({
  tenantId
}: ListAutoReplyParams): Promise<AutoReplyResponse> => {
  const stepsReplyActionAttributes = [
    'id',
    'stepReplyId',
    'words',
    'action',
    'userId',
    'userIdDest',
    'queueId',
    'initialStep'
  ];

  const stepsReplyAttributes = [
    'id',
    'reply',
    'idAutoReply',
    'nextStepId',
    'replyDefinition'
  ];

  const includes = [{
    model: StepsReplyZPRO,
    include: [{
      model: StepsReplyActionZPRO,
      as: 'stepsReplyAction',
      attributes: stepsReplyActionAttributes
    }],
    as: 'reply',
    attributes: stepsReplyAttributes
  }];

  const autoReply = await AutoReplyZPRO.findAll({
    include: includes,
    where: { tenantId },
    order: [[
      { model: StepsReplyZPRO, as: 'reply' },
      'id',
      'ASC'
    ]]
  });

  return {
    autoReply
  };
};

export default ListAutoReplyService; 