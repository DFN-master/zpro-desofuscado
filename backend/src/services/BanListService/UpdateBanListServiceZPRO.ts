import BanListZPRO from '../../models/BanList/BanListZPRO';
import AppErrorZPRO from '../../errors/AppErrorZPRO';

interface IBanListData {
  groupId: string;
  number: string;
  userId: string;
  tenantId: string;
}

interface IRequest {
  banListData: IBanListData;
  banListId: string;
}

const UpdateBanListService = async ({
  banListData,
  banListId
}: IRequest): Promise<BanListZPRO> => {
  const { groupId, number, userId, tenantId } = banListData;

  const banList = await BanListZPRO.findOne({
    where: {
      id: banListId,
      tenantId
    },
    attributes: ['id', 'groupId', 'number', 'userId']
  });

  if (!banList) {
    throw new AppErrorZPRO('ERR_NO_BAN_LIST_FOUND', 404);
  }

  await banList.update({
    groupId,
    number,
    userId
  });

  await banList.reload({
    attributes: ['id', 'groupId', 'number', 'userId']
  });

  return banList;
};

export default UpdateBanListService; 