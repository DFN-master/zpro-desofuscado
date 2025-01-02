import { parseISO, setHours, setMinutes } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import AppError from '../../errors/AppErrorZPRO';
import Campaign from '../../models/CampaignZPRO';
import { logger } from '../../utils/loggerZPRO';

interface Media {
  filename?: string;
  mimetype: string;
}

interface CampaignData {
  mediaUrl?: string;
  mediaType?: string;
  start: string | Date;
  status?: string;
  [key: string]: any;
}

interface UpdateCampaignRequest {
  campaignData: CampaignData;
  medias?: Media[];
  campaignId: string;
  tenantId: string | number;
}

const getFileNameFromPath = (path: string): string => {
  if (!path) return '';
  const parts = path.split('/');
  return parts[parts.length - 1];
};

const UpdateCampaignService = async ({
  campaignData,
  medias,
  campaignId,
  tenantId
}: UpdateCampaignRequest): Promise<Campaign> => {
  let mediaInfo: Media | undefined;
  
  // Inicializa dados da campanha com o nome do arquivo de mídia e horário de início
  let updatedData: CampaignData = {
    ...campaignData,
    mediaUrl: getFileNameFromPath(campaignData.mediaUrl),
    start: setMinutes(
      setHours(parseISO(campaignData.start), 0),
      0
    )
  };

  // Busca a campanha existente
  const campaign = await Campaign.findOne({
    where: {
      id: campaignId,
      tenantId
    }
  });

  // Verifica se a campanha existe e não está finalizada ou cancelada
  if (
    campaign?.status === 'ENDING' ||
    campaign?.status === 'CANCELED_P'
  ) {
    throw new AppError(
      'ERR_NO_UPDATE_CAMPAIGN_NOT_IN_PENDING',
      400
    );
  }

  // Processa arquivos de mídia se existirem
  if (medias && Array.isArray(medias)) {
    await Promise.all(
      medias.map(async (media) => {
        try {
          if (!media.filename) {
            const extension = media.mimetype.split('/')[1].split(';')[0];
            const newFileName = `${new Date().getTime()}_${uuidv4().replace(/-/g, '').substring(0, 8)}.${extension}`;
            media.filename = newFileName;
          }
          mediaInfo = media;
        } catch (err) {
          logger.error(err);
        }
      })
    );

    // Atualiza dados com informações da nova mídia
    updatedData = {
      ...campaignData,
      mediaUrl: mediaInfo?.filename || campaignData.mediaUrl?.split(`public/${tenantId}/`)[1],
      mediaType: mediaInfo?.mimetype.substr(0, mediaInfo.mimetype.indexOf('/'))
    };
  } else if (campaignData.mediaUrl === 'null') {
    // Remove informações de mídia se mediaUrl for 'null'
    updatedData = {
      ...campaignData,
      mediaUrl: '',
      mediaType: ''
    };
  }

  if (!campaign) {
    throw new AppError('ERR_NO_CAMPAIGN_FOUND', 404);
  }

  // Atualiza e retorna a campanha
  await campaign.update(updatedData);
  await campaign.reload();
  
  return campaign;
};

export default UpdateCampaignService; 