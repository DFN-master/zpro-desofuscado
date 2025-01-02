import { Contact } from "../../models/Contact";
import AppError from "../../errors/AppError";

interface Request {
  number: string;
  tenantId: number;
}

interface ContactResponse {
  id: number;
  name: string;
  number: string;
  email?: string;
  profilePicUrl?: string;
  tenantId: number;
  createdAt: Date;
  updatedAt: Date;
}

const ShowContactByNumberService = async ({
  number,
  tenantId
}: Request): Promise<ContactResponse> => {
  const contact = await Contact.findOne({
    where: { number }
  });

  if (!contact || contact.tenantId !== tenantId) {
    throw new AppError("ERR_NO_CONTACT_FOUND 2", 404);
  }

  return contact;
};

export default ShowContactByNumberService; 