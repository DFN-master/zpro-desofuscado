import ffmpeg from 'fluent-ffmpeg';
import { getPath } from '@ffmpeg-installer/ffmpeg';
import fs from 'fs';
import { logger } from '../utils/loggerZPRO';

interface ConversionProgress {
  percent: number;
}

const convertWebmToMp4 = (inputPath: string, outputPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Configurar o caminho do ffmpeg
    ffmpeg.setFfmpegPath(getPath());

    // Registrar início da conversão
    logger.info(`::: Z-PRO ::: Converting: ${inputPath} to ${outputPath}`);

    // Verificar se o arquivo de entrada existe
    if (!fs.existsSync(inputPath)) {
      const errorMessage = `Input file does not exist: ${inputPath}`;
      logger.error(errorMessage);
      return reject(new Error(errorMessage));
    }

    // Iniciar processo de conversão
    ffmpeg(inputPath)
      .inputFormat('webm')
      .output(outputPath)
      .outputFormat('mp4')
      .on('start', (command: string) => {
        logger.info(`::: Z-PRO ::: Spawned Ffmpeg with command: ${command}`);
      })
      .on('error', (err: Error) => {
        logger.error(`::: Z-PRO ::: Processing Error: ${err.message}`);
        reject(err);
      })
      .on('progress', (progress: ConversionProgress) => {
        logger.info(`::: Z-PRO ::: Video Transcoding: ${progress.percent}% done`);
      })
      .on('end', () => {
        logger.info('::: Z-PRO ::: Video Transcoding succeeded!');
        resolve();
      })
      .run();
  });
};

export { convertWebmToMp4 }; 