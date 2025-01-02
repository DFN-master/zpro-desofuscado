import { Campaign } from '../../models/CampaignZPRO';
import AppError from '../../errors/AppErrorZPRO';
import { removeKeysByPattern } from '../../libs/redisClientZPRO';

interface DeleteCampaignRequest {
  id: number;
  tenantId: number;
}

const DeleteCampaignService = async ({
  id,
  tenantId
}: DeleteCampaignRequest): Promise<void> => {
  const errorMessages = {
    campaignNotFound: 'ERR_NO_CAMPAIGN_FOUND',
    deletionError: 'ERROR_CAMPAIGN_NOT_EXISTS'
  };

  const campaign = await Campaign.findOne({
    where: {
      id,
      tenantId
    }
  });

  if (!campaign) {
    throw new AppError(errorMessages.campaignNotFound, 404);
  }

  try {
    await campaign.destroy();
    
    const pattern = `campaginId_${id}*`;
    await removeKeysByPattern(pattern);
  } catch (error) {
    throw new AppError(errorMessages.deletionError, 501);
  }
};

export default DeleteCampaignService; 