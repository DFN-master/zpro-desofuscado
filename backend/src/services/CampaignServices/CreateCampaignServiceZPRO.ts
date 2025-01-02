import { logger } from '../../utils/loggerZPRO';
import Campaign from '../../models/CampaignZPRO';
import { v4 as uuidv4 } from 'uuid';

interface Media {
  filename?: string;
  mimetype: string;
}

interface CampaignData {
  name: string;
  start: Date;
  message1: string;
  message2: string;
  message3: string;
  userId: number;
  delay: number;
  sessionId: string;
  tenantId: number;
}

interface CreateCampaignParams {
  campaign: CampaignData;
  medias?: Media[];
}

interface CampaignCreationData {
  name: string;
  start: Date;
  message1: string;
  message2: string;
  message3: string;
  userId: number;
  delay: number;
  mediaUrl?: string;
  mediaType?: string;
  sessionId: string;
  tenantId: number;
}

const CreateCampaignService = async ({
  campaign,
  medias
}: CreateCampaignParams): Promise<Campaign> => {
  let media: Media | undefined;

  if (medias) {
    await Promise.all(
      medias.map(async (item) => {
        try {
          if (!item.filename) {
            const extension = item.mimetype.split('/')[1].split(';')[0];
            const newFileName = uuidv4().replace(/-/g, '').substr(0, 8);
            item.filename = `${Date.now()}_${newFileName}.${extension}`;
          }
          media = item;
        } catch (err) {
          logger.error(err);
        }
      })
    );
  }

  const campaignData: CampaignCreationData = {
    name: campaign.name,
    start: campaign.start,
    message1: campaign.message1,
    message2: campaign.message2,
    message3: campaign.message3,
    userId: campaign.userId,
    delay: campaign.delay,
    mediaUrl: media?.filename,
    mediaType: media?.mimetype.substr(0, media.mimetype.indexOf('/')),
    sessionId: campaign.sessionId,
    tenantId: campaign.tenantId
  };

  const newCampaign = await Campaign.create(campaignData);
  return newCampaign;
};

export default CreateCampaignService; 