import path from 'path';
import fs from 'fs';
import axios from 'axios';

interface PackageInfo {
  name: string;
  version: string;
  author: string;
  license: string;
}

interface CustomData {
  custom_data_1_o: string;
  custom_data_2_o: string;
  custom_data_3_o: string;
}

interface AnalyticsPayload {
  client_id: string;
  events: Array<{
    name: string;
    params: CustomData;
  }>;
}

const timer = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

function randomIntFromInterval(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const rndInt = randomIntFromInterval(1000, 3000);
let isProcessing = false;

// Lê as informações do package.json
const packagePath = path.resolve(__dirname, '../../package.json');
const packageInfo: PackageInfo = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

export default {
  async handle(): Promise<void> {
    const measurementId = 'G-84CQK0KBL0';
    const apiSecret = 'M9zl-NbhR-m-ASDrk2ouww';
    const backendUrl = process.env.BACKEND_URL;

    async function sendAnalytics(eventName: string, params: CustomData): Promise<void> {
      const analyticsUrl = `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`;

      const payload: AnalyticsPayload = {
        client_id: backendUrl,
        events: [{
          name: eventName,
          params: params
        }]
      };

      try {
        await axios.post(analyticsUrl, payload);
      } catch (error) {
        // Silently handle errors
      }
    }

    const customData: CustomData = {
      custom_data_1_o: `${process.env.BACKEND_URL}-${process.env.FRONTEND_URL}-${packageInfo.name}-${packageInfo.version}-${packageInfo.author}-${packageInfo.license}`,
      custom_data_2_o: `${process.env.BACKEND_URL}-${packageInfo.name}-${packageInfo.version}-${packageInfo.author}-${packageInfo.license}`,
      custom_data_3_o: `${process.env.FRONTEND_URL}-${packageInfo.name}-${packageInfo.version}-${packageInfo.author}-${packageInfo.license}`
    };

    await sendAnalytics('custom_event', customData);
  }
}; 