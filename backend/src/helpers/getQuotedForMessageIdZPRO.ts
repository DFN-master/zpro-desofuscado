import { MessageZPRO } from '../models/MessageZPRO';

interface GetQuotedParams {
  messageId: string | number;
  tenantId: number;
}

const getQuotedForMessageId = async ({ messageId, tenantId }: GetQuotedParams) => {
  const message = await MessageZPRO.findOne({
    where: {
      messageId: String(messageId),
      tenantId: Number(tenantId)
    }
  });

  return message;
};

export default getQuotedForMessageId; 