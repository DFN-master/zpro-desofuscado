import FarewellMessageZPRO from '../../models/FarewellMessageZPRO';
import AppErrorZPRO from '../../errors/AppErrorZPRO';

interface IRequest {
  id: string;
  tenantId: number;
}

const DeleteFarewellMessageService = async ({
  id,
  tenantId
}: IRequest): Promise<void> => {
  const farewellMessage = await FarewellMessageZPRO.findOne({
    where: {
      id,
      tenantId
    }
  });

  if (!farewellMessage) {
    throw new AppErrorZPRO('ERR_NO_FAREWELL_MESSAGE_FOUND', 404);
  }

  await farewellMessage.destroy();
};

export default DeleteFarewellMessageService; 