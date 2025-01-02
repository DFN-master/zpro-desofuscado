import { Model } from 'sequelize';
import SettingZPRO from '../models/SettingZPRO';
import AppErrorZPRO from '../errors/AppErrorZPRO';

interface Setting {
  key: string;
  value: any;
}

const CheckSettings = async (key: string): Promise<any> => {
  const setting = await SettingZPRO.findOne({
    where: {
      key
    }
  });

  if (!setting) {
    throw new AppErrorZPRO('ERR_NO_SETTING_FOUND', 404);
  }

  return setting.value;
};

export default CheckSettings; 