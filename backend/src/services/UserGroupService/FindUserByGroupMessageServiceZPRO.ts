import { Model } from 'sequelize';
import UsersPrivateGroupsZPRO from '../../models/UsersPrivateGroupsZPRO';
import UserZPRO from '../../models/UserZPRO';

interface FindUserByGroupMessageRequest {
  groupId: number;
}

const FindUserByGroupMessageService = async (
  request: FindUserByGroupMessageRequest
): Promise<Model[]> => {
  const users = await UsersPrivateGroupsZPRO.findAll({
    where: {
      groupId: request.groupId
    },
    include: [
      {
        model: UserZPRO,
        as: 'user'
      }
    ]
  });

  return users;
};

export default FindUserByGroupMessageService; 