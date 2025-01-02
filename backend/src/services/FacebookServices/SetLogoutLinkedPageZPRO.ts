import { getIO } from '../../libs/socketZPRO';
import WhatsappZPRO from '../../models/WhatsappZPRO';

interface WhatsappData {
  id: number;
  tenantId: number;
  [key: string]: any;
}

interface LogoutParams {
  whatsapp: WhatsappData;
  tenantId: number;
}

interface UpdateData {
  fbPageId: null;
  fbObject: Record<string, any>;
  tokenAPI: null;
  status: string;
}

const SetLogoutLinkedPage = async ({ whatsapp, tenantId }: LogoutParams): Promise<void> => {
  const io = getIO();

  const updateData: UpdateData = {
    fbPageId: null,
    fbObject: {},
    tokenAPI: null,
    status: 'DISCONNECTED'
  };

  const whereCondition = {
    id: whatsapp.id,
    tenantId
  };

  // Atualiza os dados do WhatsApp
  await WhatsappZPRO.update(updateData, { where: whereCondition });

  // Emite evento via socket
  io.emit(`${tenantId}:whatsappSession`, {
    action: 'update',
    session: {
      ...whatsapp,
      ...updateData
    }
  });
};

export default SetLogoutLinkedPage; 