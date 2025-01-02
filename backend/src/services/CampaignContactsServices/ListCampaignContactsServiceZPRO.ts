import { Contact } from "../../models/Contact";
import { CampaignContact } from "../../models/CampaignContact";

interface Request {
  campaignId: number;
  tenantId: number;
}

interface ContactWithCampaign extends Contact {
  campaignContacts: CampaignContact[];
}

const ListCampaignContactsService = async ({
  campaignId,
  tenantId
}: Request): Promise<ContactWithCampaign[]> => {
  const contacts = await Contact.findAll({
    where: {
      tenantId
    },
    include: [
      {
        model: CampaignContact,
        as: "campaignContacts",
        where: {
          campaignId
        },
        required: true
      }
    ],
    order: [["name", "ASC"]]
  });

  return contacts;
};

export default ListCampaignContactsService; 