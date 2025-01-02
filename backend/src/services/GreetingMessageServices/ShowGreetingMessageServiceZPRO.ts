import { GreetingMessageZPRO } from "../../models/GreetingMessageZPRO";
import AppErrorZPRO from "../../errors/AppErrorZPRO";

interface Request {
  id: number;
}

class ShowGreetingMessageService {
  public async execute({ id }: Request): Promise<GreetingMessageZPRO> {
    const greetingMessage = await GreetingMessageZPRO.findByPk(id);

    if (!greetingMessage) {
      throw new AppErrorZPRO("ERR_NO_GREETING_MESSAGE_FOUND", 404);
    }

    return greetingMessage;
  }
}

export default ShowGreetingMessageService; 