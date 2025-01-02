import { GroupLinkList } from "../../models/GroupLinkListZPRO";
import AppError from "../../errors/AppErrorZPRO";

interface DeleteRequest {
  id: number;
}

const DeleteGroupLinkListService = async (id: number): Promise<void> => {
  const groupLinkList = await GroupLinkList.findOne({
    where: { id }
  });

  if (!groupLinkList) {
    throw new AppError("ERR_NO_GROUPLINKLIST_FOUND", 404);
  }

  await groupLinkList.destroy();
};

export default DeleteGroupLinkListService; 