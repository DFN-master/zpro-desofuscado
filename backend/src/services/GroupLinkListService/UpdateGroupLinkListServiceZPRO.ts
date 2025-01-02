import { GroupLinkListZPRO } from '../../models/GroupLinkListZPRO';
import AppErrorZPRO from '../../errors/AppErrorZPRO';

interface IGroupLinkListData {
  groupId: string;
  name: string;
  link: string;
  participants: string;
}

interface IRequest {
  groupLinkListData: IGroupLinkListData;
  groupLinkListId: number;
}

interface IAttributes {
  id: number;
  groupId: string;
  name: string;
  link: string;
  participants: string;
}

const UpdateGroupLinkListService = async ({
  groupLinkListData,
  groupLinkListId
}: IRequest): Promise<GroupLinkListZPRO> => {
  const { groupId, name, link, participants } = groupLinkListData;

  const groupLinkList = await GroupLinkListZPRO.findOne({
    where: { id: groupLinkListId },
    attributes: ['id', 'groupId', 'name', 'link', 'participants']
  });

  if (!groupLinkList) {
    throw new AppErrorZPRO('ERR_NO_GROUP_LINK_LIST_FOUND', 404);
  }

  await groupLinkList.update({
    groupId,
    name, 
    link,
    participants
  });

  await groupLinkList.reload({
    attributes: ['id', 'groupId', 'name', 'link', 'participants']
  });

  return groupLinkList;
};

export default UpdateGroupLinkListService; 