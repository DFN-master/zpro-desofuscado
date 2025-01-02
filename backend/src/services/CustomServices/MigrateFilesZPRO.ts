import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { Op } from 'sequelize';
import MessageZPRO from '../../models/MessageZPRO';
import TicketZPRO from '../../models/TicketZPRO';
import TenantZPRO from '../../models/TenantZPRO';
import { logger } from '../../utils/loggerZPRO';
import CampaignContactsZPRO from '../../models/CampaignContactsZPRO';
import CampaignZPRO from '../../models/CampaignZPRO';
import ChatFlowZPRO from '../../models/ChatFlowZPRO';
import ffmpeg from 'fluent-ffmpeg';
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg';
import FastReplyZPRO from '../../models/FastReplyZPRO';
import PrivateMessageZPRO from '../../models/PrivateMessageZPRO';

const publicFolder = path.resolve(__dirname, '..', '..', '..', 'public');

const copyFileAsync = promisify(fs.copyFile);
const mkdirAsync = promisify(fs.mkdir);
const existsAsync = promisify(fs.exists);
const readdirAsync = promisify(fs.readdir);

interface ChatFlowNode {
  type: string;
  interactions: {
    type: string;
    content: {
      media?: string;
    };
  }[];
}

interface ChatFlow {
  nodeList?: ChatFlowNode[];
}

const convertOggToMp3 = (inputPath: string, outputPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    ffmpeg.setFfmpegPath(ffmpegPath);
    
    ffmpeg(inputPath)
      .toFormat('mp3')
      .on('error', (err) => {
        logger.error(':::: Z-PRO :::: Error converting OGG files to MP3:', err.toString());
        reject(err);
      })
      .on('end', () => {
        logger.info(':::: Z-PRO :::: Audio Transcoding succeeded!');
        resolve();
      })
      .pipe(fs.createWriteStream(outputPath), { end: true });
  });
};

const convertOggFilesToMp3 = async (folderPath: string): Promise<void> => {
  try {
    const files = await readdirAsync(folderPath);
    
    for (const file of files) {
      if (path.extname(file).toLowerCase() === '.ogg') {
        const inputPath = path.join(folderPath, file);
        const outputPath = path.join(folderPath, path.basename(file, '.ogg') + '.mp3');

        if (!(await existsAsync(outputPath))) {
          logger.info(':::: Z-PRO :::: Converting OGG to MP3:', inputPath);
          await convertOggToMp3(inputPath, outputPath);
        } else {
          logger.info(':::: Z-PRO :::: MP3 file already exists for', inputPath);
        }
      }
    }
  } catch (error) {
    logger.error(':::: Z-PRO :::: OGG conversion error:', error);
  }
};

export const migrateFiles = async (): Promise<void> => {
  try {
    const tenants = await TenantZPRO.findAll();

    // Criar pastas para cada tenant
    for (const tenant of tenants) {
      const tenantPath = path.join(publicFolder, tenant.id.toString());
      logger.info(`:::: Z-PRO :::: Checking folder for tenant ${tenant.id} in ${tenantPath}`);

      if (!(await existsAsync(tenantPath))) {
        logger.info(`:::: Z-PRO :::: Folder does not exist. Creating for tenant ${tenant.id}`);
        await mkdirAsync(tenantPath, { recursive: true });
        logger.info(`:::: Z-PRO :::: Folder created for tenant ${tenant.id}`);
      } else {
        logger.info(`:::: Z-PRO :::: Folder already exists for tenant ${tenant.id}`);
      }
    }

    // Migrar arquivos de mensagens
    try {
      const messages = await MessageZPRO.findAll({
        where: {
          mediaUrl: { [Op.not]: null }
        },
        include: [{
          model: TicketZPRO,
          as: 'ticket'
        }],
        order: [['createdAt', 'ASC']]
      });

      await migrateMediaFiles(messages, 'mediaUrl');
    } catch (error) {
      logger.error(':::: Z-PRO :::: Message migration error:', error);
    }

    // Migrar arquivos de campanhas
    try {
      await migrateCampaignFiles();
    } catch (error) {
      logger.error(':::: Z-PRO :::: Campaign migration error:', error);
    }

    // Migrar arquivos de chatflow
    try {
      await migrateChatFlowFiles();
    } catch (error) {
      logger.error(':::: Z-PRO :::: Chatflow migration error:', error);
    }

    // Converter arquivos OGG para MP3
    for (const tenant of tenants) {
      const tenantPath = path.join(publicFolder, tenant.id.toString());
      await convertOggFilesToMp3(tenantPath);
      logger.info(':::: Z-PRO :::: Migration completed!');
    }

    logger.info(':::: Z-PRO :::: Migration completed!');
  } catch (error) {
    logger.error(':::: Z-PRO :::: Migration error:', error);
  }
};

// Funções auxiliares para migração de arquivos
const migrateMediaFiles = async (records: any[], mediaField: string): Promise<void> => {
  for (const record of records) {
    const mediaUrl = record[mediaField];
    const fileName = path.basename(mediaUrl);
    const tenantPath = path.join(publicFolder, record.tenant.id.toString());
    const sourcePath = path.join(publicFolder, fileName);
    const targetPath = path.join(tenantPath, fileName);

    if (await existsAsync(sourcePath)) {
      await copyFileAsync(sourcePath, targetPath);
      logger.info(`:::: File copied: ${sourcePath} -> ${targetPath}`);
    }
  }
};

const migrateCampaignFiles = async (): Promise<void> => {
  const campaigns = await CampaignZPRO.findAll({
    where: {
      mediaUrl: { [Op.not]: null }
    },
    include: [{
      model: TenantZPRO,
      as: 'tenant'
    }]
  });

  await migrateMediaFiles(campaigns, 'mediaUrl');
};

const migrateChatFlowFiles = async (): Promise<void> => {
  const chatflows = await ChatFlowZPRO.findAll({
    where: {
      flow: { [Op.not]: null }
    },
    include: [{
      model: TenantZPRO,
      as: 'tenant'
    }]
  });

  for (const chatflow of chatflows) {
    const flow = chatflow.flow as ChatFlow;
    
    if (flow?.nodeList) {
      for (const node of flow.nodeList) {
        if (node.type === 'MediaField') {
          for (const interaction of node.interactions) {
            if (interaction.type === 'media' && interaction.content.media) {
              const fileName = path.basename(interaction.content.media);
              const tenantPath = path.join(publicFolder, chatflow.tenant.id.toString());
              const sourcePath = path.join(publicFolder, fileName);
              const targetPath = path.join(tenantPath, fileName);

              if (await existsAsync(sourcePath)) {
                await copyFileAsync(sourcePath, targetPath);
                logger.info(`:::: File copied: ${sourcePath} -> ${targetPath}`);
              }
            }
          }
        }
      }
    }
  }
}; 