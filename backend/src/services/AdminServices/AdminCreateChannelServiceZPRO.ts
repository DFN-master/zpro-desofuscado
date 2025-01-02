import * as Yup from 'yup';
import AppError from '../../errors/AppErrorZPRO';
import Whatsapp from '../../models/WhatsappZPRO';

interface CreateChannelData {
  name: string;
  status?: string;
  isDefault?: boolean;
  tenantId: number;
  tokenTelegram?: string;
  instagramUser?: string;
  instagramKey?: string;
}

interface Response {
  whatsapp: Whatsapp;
  oldDefault: Whatsapp | null;
}

const AdminCreateChannelService = async ({
  name,
  status = 'OPENING',
  isDefault = false,
  tenantId,
  tokenTelegram,
  instagramUser,
  instagramKey
}: CreateChannelData): Promise<Response> => {
  // Schema de validação
  const schema = Yup.object().shape({
    name: Yup.string()
      .required()
      .min(2)
      .test('Check-name', 'Este nome de whatsapp já está em uso.', 
        async (value) => {
          if (value) {
            const whatsappExists = await Whatsapp.findOne({
              where: { name: value }
            });
            return !whatsappExists;
          }
          return true;
        }
      ),
    isDefault: Yup.boolean().required()
  });

  try {
    await schema.validate({ name, status, isDefault });
  } catch (err) {
    throw new AppError(err.message);
  }

  const whatsappFound = await Whatsapp.findOne({
    where: { tenantId }
  });

  if (!whatsappFound) {
    isDefault = true;
  }

  let oldDefault: Whatsapp | null = null;

  if (isDefault) {
    oldDefault = await Whatsapp.findOne({
      where: { isDefault: true, tenantId }
    });

    if (oldDefault) {
      await oldDefault.update({ isDefault: false });
    }
  }

  const whatsapp = await Whatsapp.create({
    name,
    status,
    isDefault,
    tenantId,
    tokenTelegram,
    instagramUser,
    instagramKey
  });

  return {
    whatsapp,
    oldDefault
  };
};

export default AdminCreateChannelService; 