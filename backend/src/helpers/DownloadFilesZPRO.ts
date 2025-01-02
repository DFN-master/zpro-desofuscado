import axios from 'axios';
import path from 'path';
import { writeFile } from 'fs/promises';
import mime from 'mime-types';
import { logger } from '../utils/loggerZPRO';
import { fileTypeFromBuffer } from 'file-type';

interface DownloadedFile {
  mimeType: string;
  extension: string;
  filename: string;
  data: Buffer;
  originalname: string;
}

export const downloadFiles = async (
  url: string,
  folder: string
): Promise<DownloadedFile> => {
  try {
    // Fazer download do arquivo com responseType arrayBuffer
    const { data } = await axios.get(url, { responseType: 'arraybuffer' });

    let fileExtension: string;

    // Verificar se a URL inclui CDN do Instagram
    if (url.includes('ig_messaging_cdn')) {
      const fileType = await fileTypeFromBuffer(data);
      
      if (!fileType) {
        throw new Error('Não foi possível determinar o tipo do arquivo.');
      }
      
      fileExtension = fileType.extension;
    } else {
      // Extrair extensão da URL
      fileExtension = url.split('?')[0].split('.').pop() || '';
    }

    logger.info(`::: Z-PRO ::: Download Type ${fileExtension}`);

    // Gerar nome do arquivo com timestamp
    const filename = `${new Date().getTime()}.${fileExtension}`;
    
    // Construir caminho do arquivo
    const filePath = path.join(
      __dirname,
      '../../public',
      folder,
      filename
    );

    // Salvar arquivo
    await writeFile(filePath, data, 'base64');

    // Obter informações do arquivo
    const mimeType = mime.lookup(filePath) || '';
    const extension = path.extname(filePath);
    const originalname = url.split('/').pop() || '';

    return {
      mimeType,
      extension,
      filename,
      data,
      originalname
    };

  } catch (error) {
    logger.warn('::: ZDG ::: e1 ', error);
    throw error;
  }
}; 