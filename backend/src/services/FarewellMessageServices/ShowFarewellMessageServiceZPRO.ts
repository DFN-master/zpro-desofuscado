import { FarewellMessageZPRO } from '../../models/FarewellMessageZPRO';
import AppErrorZPRO from '../../errors/AppErrorZPRO';

interface IRequest {
  id: number;
}

class ShowFarewellMessageService {
  public async execute({ id }: IRequest): Promise<FarewellMessageZPRO> {
    const farewellMessage = await FarewellMessageZPRO.findByPk(id);

    if (!farewellMessage) {
      throw new AppErrorZPRO('ERR_NO_FAREWELL_MESSAGE_FOUND', 404);
    }

    return farewellMessage;
  }
}

export default ShowFarewellMessageService; 