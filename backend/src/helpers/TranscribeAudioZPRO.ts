import * as fs from 'fs';
import { SpeechClient } from '@google-cloud/speech';

interface GoogleCredentials {
  client_email: string;
  private_key: string;
  project_id?: string;
}

interface AudioConfig {
  encoding: string;
  sampleRateHertz: number;
  languageCode: string;
}

interface TranscriptionRequest {
  audio: {
    content: string;
  };
  config: AudioConfig;
}

/**
 * Transcreve um arquivo de áudio usando Google Cloud Speech-to-Text
 * @param audioPath Caminho do arquivo de áudio
 * @param credentialsJson JSON string contendo as credenciais do Google Cloud
 * @returns Promise<string> Texto transcrito
 */
export async function transcribeAudio(
  audioPath: string, 
  credentialsJson: string
): Promise<string> {
  // Parse das credenciais
  const credentials: GoogleCredentials = JSON.parse(credentialsJson);

  // Validação das credenciais
  if (!credentials.client_email || !credentials.private_key) {
    throw new Error('As credenciais não contém os campos necessários.');
  }

  // Configuração do cliente
  const client = new SpeechClient({
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key
    },
    projectId: credentials.project_id
  });

  // Lê o arquivo de áudio
  const audioBytes = fs.readFileSync(audioPath);
  const audioContent = audioBytes.toString('base64');

  // Configuração da requisição
  const request: TranscriptionRequest = {
    audio: {
      content: audioContent
    },
    config: {
      encoding: 'MP3',
      sampleRateHertz: 16000,
      languageCode: 'pt-BR'
    }
  };

  // Faz a transcrição
  const [response] = await client.recognize(request);
  
  // Processa e retorna o resultado
  const transcription = response.results
    ?.map(result => result.alternatives?.[0].transcript)
    .join('\n') || '';

  return transcription;
} 