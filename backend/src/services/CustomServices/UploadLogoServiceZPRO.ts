import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

interface ImageSize {
  width: number;
  height: number;
  filename: string;
}

const FRONTEND_PATH = path.join(__dirname, '..', '..', '..', '..', 'frontend');
const TARGET_DIR = path.join(FRONTEND_PATH, 'public');
const ICONS_DIR = path.join(TARGET_DIR, 'icons');
const TARGET_PATH = path.join(TARGET_DIR, 'zpro.png');

const sizes: ImageSize[] = [
  { width: 16, height: 16, filename: 'favicon-16x16.png' },
  { width: 32, height: 32, filename: 'favicon-32x32.png' },
  { width: 36, height: 36, filename: 'favicon-36x36.png' },
  { width: 48, height: 48, filename: 'favicon-48x48.png' },
  { width: 57, height: 57, filename: 'favicon-57x57.png' },
  { width: 60, height: 60, filename: 'favicon-60x60.png' },
  { width: 72, height: 72, filename: 'favicon-72x72.png' },
  { width: 76, height: 76, filename: 'favicon-76x76.png' },
  { width: 96, height: 96, filename: 'favicon-96x96.png' },
  { width: 114, height: 114, filename: 'favicon-114x114.png' },
  { width: 120, height: 120, filename: 'favicon-120x120.png' },
  { width: 128, height: 128, filename: 'favicon-128x128.png' },
  { width: 144, height: 144, filename: 'favicon-144x144.png' },
  { width: 152, height: 152, filename: 'favicon-152x152.png' },
  { width: 180, height: 180, filename: 'favicon-180x180.png' },
  { width: 192, height: 192, filename: 'favicon-192x192.png' },
  { width: 128, height: 128, filename: 'icon-128x128.png' },
  { width: 192, height: 192, filename: 'icon-192x192.png' },
  { width: 256, height: 256, filename: 'icon-256x256.png' },
  { width: 384, height: 384, filename: 'icon-384x384.png' },
  { width: 512, height: 512, filename: 'icon-512x512.png' },
  // Apple Launch Images
  { width: 640, height: 1136, filename: 'apple-launch-640x1136.png' },
  { width: 750, height: 1334, filename: 'apple-launch-750x1334.png' },
  { width: 828, height: 1792, filename: 'apple-launch-828x1792.png' },
  { width: 1125, height: 2436, filename: 'apple-launch-1125x2436.png' },
  { width: 1242, height: 2208, filename: 'apple-launch-1242x2208.png' },
  { width: 1242, height: 2688, filename: 'apple-launch-1242x2688.png' },
  { width: 1536, height: 2048, filename: 'apple-launch-1536x2048.png' },
  { width: 1668, height: 2224, filename: 'apple-launch-1668x2224.png' },
  { width: 1668, height: 2388, filename: 'apple-launch-1668x2388.png' },
  { width: 2048, height: 2732, filename: 'apple-launch-2048x2732.png' }
];

const uploadLogoFile = (sourceFile: string, callback: (error: Error | null) => void): void => {
  // Criar diretório de destino se não existir
  fs.mkdir(TARGET_DIR, { recursive: true }, (mkdirErr) => {
    if (mkdirErr) return callback(mkdirErr);

    // Copiar arquivo para o diretório de destino
    fs.rename(sourceFile, TARGET_PATH, (renameErr) => {
      if (renameErr) return callback(renameErr);

      // Processar cada tamanho de imagem
      sizes.forEach(size => {
        const targetPath = path.join(ICONS_DIR, size.filename);

        // Criar diretório para ícones se não existir
        fs.mkdir(path.dirname(targetPath), { recursive: true }, (iconDirErr) => {
          if (iconDirErr) return callback(iconDirErr);

          // Redimensionar e salvar imagem
          sharp(TARGET_PATH)
            .resize(size.width, size.height)
            .toFile(targetPath, (resizeErr) => {
              if (resizeErr) {
                console.error(`Erro ao redimensionar para ${size.filename}:`, resizeErr);
              }
            });
        });
      });

      callback(null);
    });
  });
};

export { uploadLogoFile }; 