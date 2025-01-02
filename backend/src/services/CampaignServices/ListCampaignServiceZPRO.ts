import { Sequelize, literal, fn } from 'sequelize-typescript';
import Campaign from '../../models/CampaignZPRO';
import CampaignContacts from '../../models/CampaignContactsZPRO';

interface ListCampaignParams {
  tenantId: number;
}

interface CampaignAttributes {
  model: typeof CampaignContacts;
  attributes: string[];
}

const ListCampaignService = async ({ tenantId }: ListCampaignParams) => {
  const whereCondition = { tenantId };

  const includeConfig: CampaignAttributes = {
    model: CampaignContacts,
    attributes: []
  };

  const campaigns = await Campaign.findAll({
    where: whereCondition,
    attributes: {
      include: [
        [
          fn('COUNT', literal('CampaignContacts.id')),
          'contactsCount'
        ],
        [
          literal('(select count(1) from "CampaignContacts" as "w" where "w"."campaignId" = "Campaign.id" and "w"."ack" IN (1, 2, 3, 4) )'),
          'pendentesEnvio'
        ],
        [
          literal('(select count(1) from "CampaignContacts" as "w" where "w"."campaignId" = "Campaign.id" and "w"."ack" IN (2, 3, 4) )'),
          'recebidas'
        ],
        [
          literal('(select count(1) from "CampaignContacts" as "w" where "w"."campaignId" = "Campaign.id" and "w"."ack" = 0 )'),
          'lidas'
        ],
        [
          literal('(select count(1) from "CampaignContacts" as "w" where "w"."campaignId" = "Campaign.id" and "w"."ack" = 1 )'),
          'entrega'
        ]
      ]
    },
    include: [includeConfig],
    group: ['Campaign.id'],
    order: [['start', 'ASC']]
  });

  return campaigns;
};

export default ListCampaignService; 