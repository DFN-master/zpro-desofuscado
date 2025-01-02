import { Request } from 'express';
import AppError from '../../errors/AppErrorZPRO';
import CampaignContact from '../../models/CampaignContactsZPRO';
import Campaign from '../../models/CampaignZPRO';

interface DeleteCampaignContactRequest {
  campaignId: number;
  contactId: number;
  tenantId: number;
}

interface WhereCondition {
  campaignId: number;
  contactId: number;
}

interface CampaignWhereCondition {
  id: number;
  tenantId: number;
}

const DeleteCampaignContactsService = async ({
  campaignId,
  contactId,
  tenantId
}: DeleteCampaignContactRequest): Promise<void> => {
  const errorMessages = {
    notFound: "ERR_NO_CAMPAIGN_CONTACTS_NOT_FOUND",
    deleteError: "ERR_CAMPAIGN_CONTACTS_NOT_EXISTS"
  };

  const where: WhereCondition = {
    campaignId,
    contactId
  };

  const campaignWhere: CampaignWhereCondition = {
    id: campaignId,
    tenantId
  };

  const campaignContact = await CampaignContact.findOne({
    where,
    include: [
      {
        model: Campaign,
        required: true,
        where: campaignWhere
      }
    ]
  });

  if (!campaignContact) {
    throw new AppError(errorMessages.notFound, 404);
  }

  try {
    await campaignContact.destroy();
  } catch (error) {
    throw new AppError(errorMessages.deleteError, 404);
  }
};

export default DeleteCampaignContactsService; 