import { Request } from 'express';
import AppError from '../../errors/AppError';
import Campaign from '../../models/Campaign';
import CampaignContacts from '../../models/CampaignContacts';

interface DeleteAllContactsData {
  campaignId: number;
  tenantId: number;
}

const DeleteAllCampaignContactsService = async ({
  campaignId,
  tenantId
}: DeleteAllContactsData): Promise<void> => {
  try {
    const campaign = await Campaign.findOne({
      where: {
        id: campaignId,
        tenantId
      }
    });

    if (!campaign?.id) {
      throw new AppError(
        "ERR_CAMPAIGN_CONTACTS_NOT_EXISTS_OR_NOT_ACCESSIBLE",
        404
      );
    }

    await CampaignContacts.destroy({
      where: { campaignId }
    });
    
  } catch (err) {
    throw new AppError("ERR_CAMPAIGN_CONTACTS", 404);
  }
};

export default DeleteAllCampaignContactsService; 