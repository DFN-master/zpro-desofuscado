import { FastReplyZPRO } from "../../models/FastReplyZPRO";

interface Request {
  tenantId: number | string;
}

interface FastReplyResponse {
  id: number;
  key: string;
  message: string;
  tenantId: number;
  createdAt: Date;
  updatedAt: Date;
}

const ListFastReplyService = async ({ tenantId }: Request): Promise<FastReplyResponse[]> => {
  const fastReplies = await FastReplyZPRO.findAll({
    where: {
      tenantId
    },
    order: [
      ["key", "ASC"]
    ]
  });

  return fastReplies;
};

export default ListFastReplyService; 