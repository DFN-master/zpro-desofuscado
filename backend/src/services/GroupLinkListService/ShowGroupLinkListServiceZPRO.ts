import { GroupLinkListZPRO } from "../../models/GroupLinkListZPRO";
import AppErrorZPRO from "../../errors/AppErrorZPRO";

interface ShowGroupLinkListRequest {
  id: number;
}

class ShowGroupLinkListService {
  public async execute({ id }: ShowGroupLinkListRequest): Promise<GroupLinkListZPRO> {
    const groupLinkList = await GroupLinkListZPRO.findByPk(id);

    if (!groupLinkList) {
      throw new AppErrorZPRO("ERR_NO_GROUP_UPLINKLIST_FOUND", 404);
    }

    return groupLinkList;
  }
}

export default ShowGroupLinkListService; 