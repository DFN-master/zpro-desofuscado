import { Model, DataTypes, Table, Column, AllowNull, PrimaryKey, AutoIncrement, BelongsTo, HasMany, BeforeCreate, BeforeUpdate, ForeignKey, Unique } from 'sequelize-typescript';
import { sign } from 'jsonwebtoken';
import webHooksConfig from '../config/webHooks.dev.json';
import { AuthZPRO } from '../config/authZPRO';
import ApiConfigZPRO from './ApiConfigZPRO';
import TenantZPRO from './TenantZPRO';
import TicketZPRO from './TicketZPRO';
import ChatFlowZPRO from './ChatFlowZPRO';
import UserZPRO from './UserZPRO';
import QueueZPRO from './QueueZPRO';
import QueueZPRO_Dig from '../libs/QueueZPRO_Dig';

interface WhatsappAttributes {
  id: number;
  name: string;
  session: string;
  qrcode: string;
  status: string;
  battery: string;
  plugged: boolean;
  isDefault: boolean;
  isDeleted: boolean;
  retries: number;
  number: string;
  tenantId: number;
  userId: number;
  queueId: number;
  chatFlowId: number;
  type: 'messenger' | 'instagram' | 'baileys' | 'waba' | 'text';
  wppUser?: string;
  wppPass?: string;
  tokenAPI?: string;
  fbPageId?: string;
  fbObject?: object;
  wabaId?: string;
  tokenHook?: string;
  instagramKey?: string;
  proxyUrl?: string;
  proxyUser?: string;
  proxyPass?: string;
  isActive?: boolean;
  typebotUrl?: string;
  typebotName?: string;
  typebotExpires?: string;
  typebotKeyword?: string;
  typebotUnknown?: string;
  typebotOff?: string;
  chatgptPrompt?: string;
  chatgptKey?: string;
  chatgptOrg?: string;
  chatgptOff?: string;
  dialogflow?: boolean;
  remotePath?: string;
  authToken?: string;
  webversion?: string;
  difyUrl?: string;
  difyKey?: string;
  difyOff?: string;
  difyRestart?: string;
  wabaVersion?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Table
export default class Whatsapp extends Model<WhatsappAttributes> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @AllowNull(false)
  @Unique
  @Column(DataTypes.STRING)
  name: string;

  @Column(DataTypes.STRING)
  session: string;

  @Column(DataTypes.STRING)
  qrcode: string;

  @Column
  status: string;

  @Column
  battery: string;

  @Column
  plugged: boolean;

  @AllowNull(false)
  @Column
  isDefault: boolean;

  @AllowNull(false)
  @Column
  isDeleted: boolean;

  @Column
  retries: number;

  @AllowNull(false)
  @Column
  number: string;

  @Column(DataTypes.ENUM('messenger', 'instagram', 'baileys', 'waba', 'text'))
  type: string;

  @Column(DataTypes.STRING)
  wppUser: string;

  @Column(DataTypes.STRING)
  wppPass: string;

  @Column(DataTypes.STRING)
  tokenAPI: string;

  @Column(DataTypes.STRING)
  fbPageId: string;

  @Column(DataTypes.JSONB)
  fbObject: object;

  @Column(DataTypes.STRING)
  wabaId: string;

  @Column(DataTypes.STRING)
  tokenHook: string;

  @Column(DataTypes.STRING)
  instagramKey: string;

  @Column(DataTypes.STRING)
  proxyUrl: string;

  @Column(DataTypes.STRING)
  proxyUser: string;

  @Column(DataTypes.STRING)
  proxyPass: string;

  @Column
  isActive: boolean;

  @Column(DataTypes.STRING)
  typebotUrl: string;

  @Column(DataTypes.STRING)
  typebotName: string;

  @Column(DataTypes.STRING)
  typebotExpires: string;

  @Column(DataTypes.STRING)
  typebotKeyword: string;

  @Column(DataTypes.STRING)
  typebotUnknown: string;

  @Column(DataTypes.STRING)
  typebotOff: string;

  @Column(DataTypes.STRING)
  chatgptPrompt: string;

  @Column(DataTypes.STRING)
  chatgptKey: string;

  @Column(DataTypes.STRING)
  chatgptOrg: string;

  @Column(DataTypes.STRING)
  chatgptOff: string;

  @Column
  dialogflow: boolean;

  @Column(DataTypes.STRING)
  remotePath: string;

  @Column(DataTypes.STRING)
  authToken: string;

  @Column(DataTypes.STRING)
  webversion: string;

  @Column(DataTypes.STRING)
  difyUrl: string;

  @Column(DataTypes.STRING)
  difyKey: string;

  @Column(DataTypes.STRING)
  difyOff: string;

  @Column(DataTypes.STRING)
  difyRestart: string;

  @Column(DataTypes.STRING)
  wabaVersion: string;

  @Column
  createdAt: Date;

  @Column
  updatedAt: Date;

  // Relacionamentos
  @HasMany(() => TicketZPRO)
  tickets: TicketZPRO[];

  @ForeignKey(() => TenantZPRO)
  @Column
  tenantId: number;

  @BelongsTo(() => TenantZPRO)
  tenant: TenantZPRO;

  @ForeignKey(() => UserZPRO)
  @Column
  userId: number;

  @BelongsTo(() => UserZPRO)
  user: UserZPRO;

  @ForeignKey(() => QueueZPRO)
  @Column
  queueId: number;

  @BelongsTo(() => QueueZPRO)
  queue: QueueZPRO;

  @ForeignKey(() => ChatFlowZPRO)
  @Column
  chatFlowId: number;

  @BelongsTo(() => ChatFlowZPRO)
  chatFlow: ChatFlowZPRO;

  // Getters virtuais
  @Column(DataTypes.VIRTUAL)
  get urlMessengerWebHook(): string {
    const whatsappId = this.getDataValue('id');
    const tenantId = this.getDataValue('tenantId');
    let baseUrl = process.env.BACKEND_URL;

    if (process.env.NODE_ENV === 'dev') {
      baseUrl = webHooksConfig.webHooks;
    }

    return `${baseUrl}/fb-messenger-hooks/${tenantId}/${whatsappId}`;
  }

  @Column(DataTypes.VIRTUAL)
  get urlWabaWebHook(): string {
    const whatsappId = this.getDataValue('id');
    let baseUrl = process.env.BACKEND_URL;

    if (process.env.NODE_ENV === 'dev') {
      baseUrl = webHooksConfig.webHooks;
    }

    return `${baseUrl}/wabahooks/${whatsappId}`;
  }

  // Hooks
  @BeforeCreate
  @BeforeUpdate
  static async generateToken(instance: Whatsapp): Promise<void> {
    if (!instance.name && (instance.type === 'messenger' || instance.type === 'instagram')) {
      const payload = {
        tenantId: instance.tenantId,
        whatsappId: instance.id
      };
      
      const token = sign(payload, AuthZPRO.secret, { expiresIn: '10000d' });
      instance.name = token;
    }
  }

  static async CreateToken(data: {
    status: string;
    name: string;
    qrcode: string;
    number: string;
    tenantId: number;
    id: number;
  }): Promise<void> {
    const { status, name, qrcode, number, tenantId, id } = data;

    const payload = {
      name,
      number,
      status,
      qrcode,
      timestamp: Date.now(),
      type: 'ZPRO-WebHooksAPI'
    };

    const apiConfigs = await ApiConfigZPRO.findAll({
      where: {
        tenantId,
        whatsappId: id
      }
    });

    if (!apiConfigs) return;

    await Promise.all(
      apiConfigs.map(async (apiConfig) => {
        if (apiConfig.urlMessengerWebHook) {
          if (apiConfig.tokenAPI) {
            payload.tokenAPI = apiConfig.tokenAPI;
          }
          return QueueZPRO_Dig.add(id + '-WebHooksAPI', {
            url: apiConfig.urlMessengerWebHook,
            type: payload.type,
            payload
          });
        }
      })
    );
  }
}

export { WhatsappAttributes }; 