import AppError from "../../errors/AppErrorZPRO";
import GroupMessage from "../../models/GroupMessagesZPRO";

interface UpdateGroupMessageData {
  groupData: {
    group: string;
    isActive: boolean;
    userId: number;
    tenantId: number;
  };
  groupId: number;
}

interface GroupMessageAttributes {
  id: number;
  group: string;
  isActive: boolean;
  userId: number;
  tenantId: number;
}

const UpdateGroupMessageService = async ({
  groupData,
  groupId
}: UpdateGroupMessageData): Promise<GroupMessageAttributes> => {
  const { group, isActive, userId, tenantId } = groupData;

  const groupMessage = await GroupMessage.findOne({
    where: {
      id: groupId,
      tenantId
    },
    attributes: ["id", "group", "isActive", "userId"]
  });

  if (!groupMessage) {
    throw new AppError("ERR_GROUP_NOT_FOUND", 404);
  }

  await groupMessage.update({
    group,
    isActive,
    userId
  });

  await groupMessage.reload({
    attributes: ["id", "group", "isActive", "userId"]
  });

  return groupMessage;
};

export default UpdateGroupMessageService; 