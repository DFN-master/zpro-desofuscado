import nodemailer from 'nodemailer';
import { logger } from '../../utils/loggerZPRO';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

interface EmailData extends EmailConfig {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function enviarEmail(emailData: EmailData): Promise<void> {
  const transportConfig = {
    host: emailData.host,
    port: emailData.port,
    secure: emailData.secure,
    auth: {
      user: emailData.user,
      pass: emailData.pass
    }
  };

  const transporter = nodemailer.createTransport(transportConfig);

  try {
    await transporter.sendMail(emailData);
    logger.info(':::: Z-PRO :::: E-mail enviado com sucesso!');
  } catch (error) {
    logger.warn(':::: Z-PRO :::: Erro ao enviar o e-mail:', error);
  }
} 