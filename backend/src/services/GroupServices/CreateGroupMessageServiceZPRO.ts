import { GroupMessagesZPRO } from "../../models/GroupMessagesZPRO";

interface CreateGroupMessageData {
  group: string;
  isActive: boolean;
  userId: number;
  tenantId: number;
}

const CreateGroupMessageService = async ({
  group,
  isActive,
  userId,
  tenantId
}: CreateGroupMessageData): Promise<GroupMessagesZPRO> => {
  
  const groupMessage = await GroupMessagesZPRO.create({
    group,
    isActive,
    userId,
    tenantId
  });

  return groupMessage;
};

export default CreateGroupMessageService; 