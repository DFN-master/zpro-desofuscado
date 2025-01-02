import AppError from "../../errors/AppError";
import socketEmit from "../../helpers/socket/EmitZPRO";
import Contact from "../../models/Contact";
import ContactTag from "../../models/ContactTag";

interface UpdateContactTagsData {
  tagId: number;
  contactId: number;
  tenantId: number;
}

interface ContactAttributes {
  id: number;
  name: string;
  number: string;
  email: string;
  profilePicUrl: string;
  wallets: any[];
  birthdayDate: Date;
  cpf: string;
  extraInfo: string;
  businessName: string;
  firstName: string;
  lastName: string;
  tenantId: number;
}

const UpdateContactTagsBotService = async ({
  tagId,
  contactId,
  tenantId
}: UpdateContactTagsData): Promise<ContactAttributes> => {
  // Verifica se já existe a tag para o contato
  const existingTag = await ContactTag.findOne({
    where: {
      tenantId,
      contactId,
      tagId
    }
  });

  // Se não existir, cria uma nova
  if (!existingTag) {
    await ContactTag.create({
      tagId,
      contactId,
      tenantId
    });
  }

  // Busca o contato com todas as informações relacionadas
  const contact = await Contact.findOne({
    where: {
      id: contactId,
      tenantId
    },
    attributes: [
      "id",
      "name",
      "number", 
      "email",
      "profilePicUrl",
      "wallets",
      "birthdayDate",
      "cpf",
      "extraInfo",
      "businessName"
    ],
    include: [
      "wallets",
      "attributes",
      {
        association: "tags",
        attributes: ["id", "name"]
      }
    ]
  });

  if (!contact) {
    throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  }

  // Emite evento via socket
  socketEmit({
    tenantId,
    type: "contact:updateTagZPRO",
    payload: contact
  });

  return contact;
};

export default UpdateContactTagsBotService; 