import { Contact } from "../../models/Contact";
import { ContactWallet } from "../../models/ContactWallet";
import { EmitZPRO } from "../../helpers/socket";

interface IWallet {
  id?: number;
}

interface ICreateContactData {
  name: string;
  number: string;
  email?: string;
  extraInfo?: string[];
  tenantId: number;
  wallets?: IWallet[];
  cpf?: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  birthdayDate?: Date;
}

interface IContactAttributes {
  id: number;
  name: string;
  number: string;
  email: string;
  extraInfo: string[];
  tenantId: number;
  cpf: string;
  firstName: string;
  lastName: string;
  businessName: string;
  birthdayDate: Date;
}

const CreateContactService = async ({
  name,
  number,
  email = "",
  extraInfo = [],
  tenantId,
  wallets,
  cpf,
  firstName,
  lastName,
  businessName,
  birthdayDate
}: ICreateContactData): Promise<IContactAttributes> => {
  
  // Verifica se já existe um contato com mesmo número e tenantId
  const contactExists = await Contact.findOne({
    where: {
      number,
      tenantId
    }
  });

  if (contactExists) {
    return contactExists;
  }

  // Cria o novo contato
  const contact = await Contact.create({
    name,
    number,
    email,
    extraInfo,
    tenantId,
    cpf,
    firstName,
    lastName,
    businessName,
    birthdayDate
  }, {
    include: [
      "extraInfo",
      "tags",
      {
        association: "wallets",
        attributes: ["id", "name"]
      }
    ]
  });

  // Se houver wallets, cria as relações
  if (wallets) {
    // Remove relações existentes
    await ContactWallet.destroy({
      where: {
        tenantId,
        contactId: contact.id
      }
    });

    // Cria novas relações
    const contactWallets = [];
    wallets.forEach(wallet => {
      contactWallets.push({
        walletId: wallet.id ? wallet.id : wallet,
        contactId: contact.id,
        tenantId
      });
    });

    await ContactWallet.bulkCreate(contactWallets);
  }

  // Recarrega o contato com as relações
  await contact.reload({
    attributes: [
      "id",
      "name",
      "number",
      "email",
      "extraInfo",
      "cpf",
      "birthdayDate", 
      "firstName",
      "lastName",
      "businessName"
    ],
    include: [
      "extraInfo",
      "tags",
      {
        association: "wallets",
        attributes: ["id", "name"]
      }
    ]
  });

  // Emite evento de atualização
  EmitZPRO({
    tenantId,
    type: "contact:update",
    payload: contact
  });

  return contact;
};

export default CreateContactService; 