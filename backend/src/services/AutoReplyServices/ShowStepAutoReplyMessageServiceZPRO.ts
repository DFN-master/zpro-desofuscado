import { Model } from 'sequelize';
import AutoReplyZPRO from '../../models/AutoReplyZPRO';
import StepsReplyZPRO from '../../models/StepsReplyZPRO';
import AppErrorZPRO from '../../errors/AppErrorZPRO';

interface IRequest {
  tenantId: number;
  idAutoReply?: number;
  id?: number;
  initialStep?: boolean;
  action?: string;
}

interface IAutoReplyInclude {
  model: typeof AutoReplyZPRO;
  where: {
    tenantId: number;
    action?: string;
  };
}

interface IStepQuery {
  where: {
    idAutoReply?: number;
    id?: number;
    initialStep?: boolean;
  };
  include: IAutoReplyInclude[];
}

const ShowStepAutoReplyMessageService = async (
  tenantId: number,
  idAutoReply?: number,
  id?: number,
  initialStep: boolean = false,
  action?: string
): Promise<Model> => {
  const whereCondition = initialStep
    ? { initialStep }
    : { idAutoReply, id };

  const query: IStepQuery = {
    where: whereCondition,
    include: [
      {
        model: AutoReplyZPRO,
        where: {
          tenantId,
          ...(action && { action })
        }
      }
    ]
  };

  const step = await StepsReplyZPRO.findOne(query);

  if (!step) {
    throw new AppErrorZPRO('ERR_NO_STEP_AUTO_REPLY_FOUND', 404);
  }

  return step;
};

export default ShowStepAutoReplyMessageService; 