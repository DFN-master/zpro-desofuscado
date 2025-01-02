import fs from 'fs';
import path from 'path';

// Definindo constantes de caminhos
const FRONTEND_PATH = path.join(__dirname, '..', '..', '..', '..', 'frontend');
const PUBLIC_DIR = path.join(FRONTEND_PATH, 'public');
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons');
const TARGET_PATH_PUBLIC = path.join(PUBLIC_DIR, 'favicon.ico');
const TARGET_PATH_ICONS = path.join(ICONS_DIR, 'favicon.ico');

interface UploadCallback {
  (error: Error | null): void;
}

/**
 * Faz upload de um arquivo de ícone para os diretórios público e de ícones
 * @param sourceFile Caminho do arquivo de origem
 * @param callback Função de callback para tratamento de erros
 */
const uploadIconFile = (sourceFile: string, callback: UploadCallback): void => {
  const copyFileAsync = (source: string, target: string, cb: UploadCallback): void => {
    fs.copyFile(source, target, cb);
  };

  // Cria o diretório de ícones se não existir
  fs.mkdir(ICONS_DIR, { recursive: true }, (mkdirError) => {
    if (mkdirError) {
      return callback(mkdirError);
    }

    // Copia o arquivo para o diretório público
    copyFileAsync(sourceFile, TARGET_PATH_PUBLIC, (publicError) => {
      if (publicError) {
        return callback(publicError);
      }

      // Copia o arquivo para o diretório de ícones
      copyFileAsync(sourceFile, TARGET_PATH_ICONS, (iconsError) => {
        if (iconsError) {
          return callback(iconsError);
        }

        // Remove o arquivo temporário original
        fs.unlink(sourceFile, (unlinkError) => {
          if (unlinkError) {
            console.error(`Erro ao remover o arquivo temporário: ${unlinkError.message}`);
          }
          callback(null);
        });
      });
    });
  });
};

export { uploadIconFile }; 