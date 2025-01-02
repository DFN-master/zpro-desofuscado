import { Request, Response } from 'express';
import axios from 'axios';

interface AuthRequest {
  username: string;
  password: string;
}

export async function autenticar(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body as AuthRequest;

  try {
    const config = {
      username: process.env.USUARIO_API,
      password: process.env.SENHA_API
    };

    const response = await axios.post('https://zpro.com.br', config);
    res.json(response.data);
    
  } catch (error) {
    res.status(401).json({
      error: 'Erro na autenticação'
    });
  }
} 