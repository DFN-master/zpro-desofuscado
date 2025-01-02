import { Request, Response } from 'express';
import { AppErrorZPRO } from '../errors/AppErrorZPRO';
import { terminalService } from '../services/TerminalServices/TerminalServiceZPRO';

interface IRequestWithUser extends Request {
  user: {
    profile: string;
  };
}

export async function handleCommand(
  request: IRequestWithUser,
  response: Response
): Promise<void> {
  // Verifica se o usuário tem perfil de superadmin
  if (request.user.profile !== 'superadmin') {
    throw new AppErrorZPRO('ERR_NO_PERMISSION', 403);
  }

  const { command } = request.body;

  try {
    const output = await terminalService.sendCommand(command);
    
    response.send({
      message: 'Comando executado com sucesso.',
      output: output.trim()
    });
  } catch (error) {
    response.status(500).send({ 
      error: error.toString() 
    });
  }
} 