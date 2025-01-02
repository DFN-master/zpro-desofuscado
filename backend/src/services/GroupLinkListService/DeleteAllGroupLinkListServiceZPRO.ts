import { GroupLinkListZPRO } from '../../models/GroupLinkListZPRO';
import AppErrorZPRO from '../../errors/AppErrorZPRO';

interface DeleteAllGroupLinkListResponse {
  success: boolean;
}

const DeleteAllGroupLinkListService = async (): Promise<DeleteAllGroupLinkListResponse> => {
  const groupLinks = await GroupLinkListZPRO.findAll();

  if (!groupLinks || groupLinks.length === 0) {
    throw new AppErrorZPRO('ERR_NO_GROUPLINKLIST_FOUND', 404);
  }

  // Delete all group links
  for (const link of groupLinks) {
    await link.destroy();
  }

  return {
    success: true
  };
};

export default DeleteAllGroupLinkListService; 