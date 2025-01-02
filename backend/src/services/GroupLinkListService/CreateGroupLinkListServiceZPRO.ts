import AppError from "../../errors/AppError";
import GroupLinkList from "../../models/GroupLinkList";

interface ICreateGroupLinkList {
  groupId: number;
  name: string;
  link: string;
  participants: string;
}

interface IGroupLinkList {
  id: number;
  groupId: number;
  name: string;
  link: string;
  participants: string;
  createdAt: Date;
  updatedAt: Date;
}

const CreateGroupLinkListService = async ({
  groupId,
  name,
  link,
  participants
}: ICreateGroupLinkList): Promise<IGroupLinkList> => {
  // Verifica se já existe um link para este grupo
  const linkExists = await GroupLinkList.findOne({
    where: {
      groupId,
      link
    }
  });

  if (linkExists) {
    throw new AppError("ERR_GROUPLINKLIST_DUPLICATED");
  }

  // Cria novo link para o grupo
  const groupLink = await GroupLinkList.create({
    groupId,
    name,
    link,
    participants
  });

  return groupLink;
};

export default CreateGroupLinkListService; 