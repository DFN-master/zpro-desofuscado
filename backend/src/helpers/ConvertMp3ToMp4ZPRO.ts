import ffmpeg from 'fluent-ffmpeg';
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg';
import fs from 'fs';
import { logger } from '../utils/loggerZPRO';

interface ConversionError extends Error {
  message: string;
}

const convertMp3ToMp4 = (inputPath: string, outputPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Configurar o caminho do FFmpeg
    ffmpeg.setFfmpegPath(ffmpegPath);

    // Registrar início da conversão
    logger.info(`::: Z-PRO ::: ZDG ::: Convertendo ${inputPath} para ${outputPath}`);

    // Verificar se o arquivo de entrada existe
    if (!fs.existsSync(inputPath)) {
      const errorMessage = `Input file does not exist: ${inputPath}`;
      logger.error(errorMessage);
      return reject(new Error(errorMessage));
    }

    // Iniciar processo de conversão
    ffmpeg(inputPath)
      .inputFormat('mp3')
      .output(outputPath)
      .outputFormat('mp4')
      .on('progress', (progress) => {
        logger.info(`::: Z-PRO ::: ZDG ::: Spawned FFmpeg with command: ${progress}`);
      })
      .on('error', (err: ConversionError) => {
        logger.info(`::: Z-PRO ::: ZDG ::: Encoding Error: ${err.message}`);
        reject(err);
      })
      .on('progress', (progress) => {
        logger.info(`::: Z-PRO ::: ZDG ::: Processing: ${progress.percent}% done`);
      })
      .on('end', () => {
        logger.info('::: Z-PRO ::: ZDG ::: Video Transcoding succeeded!');
        resolve();
      })
      .run();
  });
};

export { convertMp3ToMp4 }; 