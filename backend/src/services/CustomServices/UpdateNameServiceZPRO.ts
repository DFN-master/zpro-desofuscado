import fs from 'fs';
import path from 'path';

interface UpdateCallback {
  (error: Error | null): void;
}

const filesToUpdate = [
  path.join(__dirname, '..', '..', '..', '..', 'frontend', 'src', 'App.vue'),
  path.join(__dirname, '..', '..', '..', '..', 'frontend', 'quasar.conf.js'),
  path.join(__dirname, '..', '..', '..', '..', 'frontend', 'src', 'index.template.html')
];

const updateAppName = (newName: string, callback: UpdateCallback): void => {
  filesToUpdate.forEach(filePath => {
    fs.readFile(filePath, 'utf8', (err: Error | null, content: string) => {
      if (err) return callback(err);

      let updatedContent: string | null = null;

      if (filePath.includes('App.vue')) {
        updatedContent = updateAppVue(content, newName);
      } else if (filePath.includes('quasar.conf.js')) {
        updatedContent = updateQuasarConf(content, newName);
      } else if (filePath.includes('index.template.html')) {
        updatedContent = updateIndexTemplate(content, newName);
      }

      if (updatedContent) {
        fs.writeFile(filePath, updatedContent, 'utf8', (writeErr: Error | null) => {
          if (writeErr) return callback(writeErr);
          
          console.log(`Nome do aplicativo atualizado para "${newName}" em ${filePath}`);
        });
      } else {
        callback(null);
      }
    });
  });
};

function updateAppVue(content: string, newName: string): string {
  return content.replace(
    /name:\s*['"][^'"]*['"]/,
    `name: '${newName}'`
  );
}

function updateQuasarConf(content: string, newName: string): string {
  let updatedContent = content.replace(
    /name:\s*['"][^'"]*['"]/,
    `name: '${newName}'`
  );
  
  updatedContent = updatedContent.replace(
    /short_name:\s*['"][^'"]*['"]/,
    `short_name: '${newName}'`
  );
  
  updatedContent = updatedContent.replace(
    /appId:\s*['"][^'"]*['"]/,
    `appId: '${newName}'`
  );
  
  return updatedContent;
}

function updateIndexTemplate(content: string, newName: string): string {
  return content.replace(
    /<title>[^<]*<\/title>/,
    `<title>${newName}</title>`
  );
}

export { updateAppName }; 