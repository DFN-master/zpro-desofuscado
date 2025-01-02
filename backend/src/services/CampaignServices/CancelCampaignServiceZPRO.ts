import Campaign from '../../models/Campaign';
import AppError from '../../errors/AppError';
import { removeKeysByPattern } from '../../libs/redisClient';

interface CancelCampaignRequest {
  campaignId: number;
  tenantId: number;
}

interface Campaign {
  id: number;
  tenantId: number;
  status: string;
  update(data: Partial<Campaign>): Promise<Campaign>;
}

const CancelCampaignService = async ({
  campaignId,
  tenantId
}: CancelCampaignRequest): Promise<void> => {
  const campaign = await Campaign.findOne({
    where: {
      id: campaignId,
      tenantId
    }
  });

  if (!campaign) {
    throw new AppError('ERROR_CAMPAIGN_NOT_EXISTS', 404);
  }

  try {
    // Remove chaves do Redis relacionadas à campanha
    const pattern = `campaginId_${campaignId}*`;
    await removeKeysByPattern(pattern);

    // Atualiza o status da campanha para cancelado
    await campaign.update({
      status: 'canceled'
    });
  } catch (error) {
    throw new AppError(`ERROR: ${error}`, 500);
  }
};

export default CancelCampaignService; 