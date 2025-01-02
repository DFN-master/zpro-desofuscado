import ffmpeg from 'fluent-ffmpeg';
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg';
import fs from 'fs';
import { logger } from '../utils/loggerZPRO';

interface ConversionProgress {
  percent: number;
}

const convertMpegToMp4 = (inputPath: string, outputPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Configurar o caminho do ffmpeg
    ffmpeg.setFfmpegPath(ffmpegPath);

    // Registrar início da conversão
    logger.info(`::: Z-PRO ::: Video Transcoding: Converting ${inputPath} to ${outputPath}`);

    // Verificar se o arquivo de entrada existe
    if (!fs.existsSync(inputPath)) {
      const errorMessage = `Input file does not exist: ${inputPath}`;
      logger.error(errorMessage);
      return reject(new Error(errorMessage));
    }

    // Iniciar processo de conversão
    ffmpeg(inputPath)
      .inputFormat('mpeg')
      .output(outputPath)
      .outputFormat('mp4')
      .on('start', (command: string) => {
        logger.info(`::: Z-PRO ::: Encoding: Spawned Ffmpeg with command: ${command}`);
      })
      .on('error', (error: Error) => {
        logger.info(`::: Z-PRO ::: Processing: Error: ${error.message}`);
        reject(error);
      })
      .on('progress', (progress: ConversionProgress) => {
        logger.info(`::: Z-PRO ::: Processing: ${progress.percent}% done`);
      })
      .on('end', () => {
        logger.info('::: ZDG ::: Z-PRO Video Transcoding succeeded!');
        resolve();
      })
      .run();
  });
};

export { convertMpegToMp4 }; 