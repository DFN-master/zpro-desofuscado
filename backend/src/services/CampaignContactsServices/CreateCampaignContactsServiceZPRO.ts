import * as Yup from 'yup';
import AppError from '../../errors/AppErrorZPRO';
import CampaignContacts from '../../models/CampaignContactsZPRO';

interface Contact {
  id: number;
  name: string;
}

interface CampaignContact {
  contactId: number;
  campaignId: number;
  contactName: string;
  messageRandom: string;
}

interface Request {
  campaignContacts: Contact[];
  campaignId: number;
}

const CreateCampaignContactsService = async ({
  campaignContacts,
  campaignId
}: Request): Promise<void> => {
  // Função auxiliar para gerar número aleatório dentro de um intervalo
  const getRandomNumber = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  // Busca contatos existentes para esta campanha
  const existingContacts = await CampaignContacts.findAll({
    where: {
      campaignId
    }
  });

  // Mapeia os novos contatos para o formato necessário
  const newContacts = campaignContacts.map((contact) => ({
    contactId: contact.id,
    campaignId,
    contactName: contact.name,
    messageRandom: `message${getRandomNumber(1000, 9999)}`
  }));

  // Filtra apenas contatos que ainda não existem na campanha
  const filteredContacts = newContacts.filter((newContact) => {
    const exists = existingContacts === null || existingContacts === undefined 
      ? -1 
      : existingContacts.findIndex(
          (existing) => 
            newContact.contactId === existing.contactId && 
            +campaignId === existing.campaignId
        );

    if (exists === -1) {
      return newContact;
    }
  });

  // Schema de validação
  const schema = Yup.array().of(
    Yup.object().shape({
      messageRandom: Yup.string().required(),
      campaignId: Yup.number().required(),
      contactId: Yup.number().required()
    })
  );

  // Valida os dados
  try {
    await schema.validate(filteredContacts);
  } catch (error) {
    throw new AppError(error.message);
  }

  // Cria os novos contatos da campanha
  try {
    await CampaignContacts.bulkCreate(filteredContacts);
  } catch (error) {
    throw new AppError(error.message);
  }
};

export default CreateCampaignContactsService; 