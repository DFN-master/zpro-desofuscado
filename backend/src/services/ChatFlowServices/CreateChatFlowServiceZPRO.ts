import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import ChatFlowZPRO from '../../models/ChatFlowZPRO';
import { logger } from '../../utils/loggerZPRO';
import ffmpeg from 'fluent-ffmpeg';
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg';
import { writeFile } from 'fs/promises';

interface CreateChatFlowData {
  flow: any; // Defina um tipo mais específico baseado na sua estrutura de flow
  userId: number;
  tenantId: number;
  name: string;
  isActive: boolean;
}

interface MediaField {
  base64: string;
  fileName: string;
  mediaUrl?: string;
}

interface FlowNode {
  type: string;
  mediaField?: MediaField;
  interactions?: any[]; // Defina um tipo mais específico se necessário
}

const writeFileAsync = promisify(writeFile);

const convertOggToMp3 = (inputPath: string, outputPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(outputPath);
    
    ffmpeg.setFfmpegPath(ffmpegPath);

    ffmpeg(inputPath)
      .toFormat('mp3')
      .pipe('mpeg')
      .on('error', (error) => {
        logger.info(`::: Z-PRO ::: ZDG ::: Audio Transcoding Error: ${error.message}`);
        reject(error);
      })
      .on('end', () => {
        logger.info('::: Z-PRO ::: ZDG ::: Audio Transcoding succeeded!');
        resolve();
      })
      .pipe(writeStream, { end: true });
  });
};

const CreateChatFlowService = async ({
  flow,
  userId,
  tenantId,
  name,
  isActive
}: CreateChatFlowData) => {
  try {
    // Processa os nós do flow
    for await (const node of flow.nodeList) {
      if (node.type === 'MediaField') {
        // Processa interações de mídia
        for await (const interaction of node.interactions) {
          if (interaction.type === 'media' && interaction.mediaField?.base64) {
            const fileName = `${new Date().getTime()}-${interaction.mediaField.fileName}`;
            const filePath = path.resolve(
              __dirname,
              '..',
              '..',
              '..',
              'public',
              tenantId.toString(),
              fileName
            );

            // Salva o arquivo de mídia
            await writeFileAsync(
              filePath,
              interaction.mediaField.base64.split('base64')[1],
              'base64'
            );

            const fullPath = path.join(__dirname, '..', '..', '..', '..', 'public', fileName);
            const extIndex = fullPath.lastIndexOf('.');
            const ext = extIndex < 0 ? '' : fullPath.substring(extIndex);

            // Converte OGG para MP3 se necessário
            if (ext === '.ogg') {
              const mp3Path = path.join(
                path.dirname(fullPath),
                path.basename(fullPath, path.extname(fullPath)) + '.mp3'
              );
              
              await convertOggToMp3(fullPath, mp3Path);
              logger.info('::: Z-PRO ::: ZDG ::: Audio Transcoding update!');
            }

            // Atualiza os campos de mídia
            delete interaction.mediaField.base64;
            interaction.mediaField.mediaUrl = interaction.mediaField.fileName;
            interaction.mediaField.fileName = fileName;
          }
        }
      }
    }

    // Cria o registro do flow
    const chatFlow = await ChatFlowZPRO.create({
      flow,
      userId,
      tenantId,
      name,
      isActive
    });

    return chatFlow;
  } catch (error) {
    logger.error('Error creating chat flow:', error);
    throw error;
  }
};

export default CreateChatFlowService; 