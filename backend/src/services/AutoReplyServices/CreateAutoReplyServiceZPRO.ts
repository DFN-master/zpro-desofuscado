import AutoReplyZPRO from '../../models/AutoReplyZPRO';

interface CreateAutoReplyData {
  name: string;
  action: string;
  userId: number;
  tenantId: number;
}

const CreateAutoReplyService = async ({
  name,
  action,
  userId,
  tenantId
}: CreateAutoReplyData): Promise<AutoReplyZPRO> => {
  const autoReply = await AutoReplyZPRO.create({
    name,
    action,
    userId,
    tenantId
  });

  return autoReply;
};

export default CreateAutoReplyService; 