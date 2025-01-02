import { Contact } from "../../models/Contact";
import AppError from "../../errors/AppError";

interface Request {
  id: string | number;
  tenantId: string | number;
}

interface ContactAttributes {
  id: string;
  name: string;
  number: string;
  email?: string;
  profilePicUrl?: string;
  tenantId: string | number;
  extraInfo?: any;
  tags?: any[];
  wallets?: any[];
}

const ShowContactService = async ({
  id,
  tenantId
}: Request): Promise<ContactAttributes> => {
  const contact = await Contact.findByPk(id, {
    include: [
      "extraInfo",
      "tags",
      {
        association: "wallets",
        attributes: ["id", "name"]
      }
    ]
  });

  if (!contact || contact.tenantId !== tenantId) {
    throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  }

  return contact;
};

export default ShowContactService; 