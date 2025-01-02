import { Model, Column, DataType, PrimaryKey, BelongsTo, ForeignKey, AllowNull, AfterCreate, AfterUpdate } from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import TenantZPRO from './TenantZPRO';
import WhatsappZPRO from './WhatsappZPRO';
import QueueZPRODig from '../libs/QueueZPRO_Dig';

export default class ApiMessage extends Model {
  @PrimaryKey
  @Column(DataType.UUID)
  @Column(() => uuidv4)
  id!: string;

  @ForeignKey(() => WhatsappZPRO)
  @Column
  sessionId!: number;

  @BelongsTo(() => WhatsappZPRO)
  session!: WhatsappZPRO;

  @Column(() => 0)
  @Column
  messageId!: number;

  @PrimaryKey
  @Column
  timestamp!: string;

  @Column(DataType.TEXT)
  messageWA!: string;

  @AllowNull(false)
  @Column
  body!: string;

  @Column
  mediaUrl?: string;

  @Column
  mediaName?: string;

  @Column
  externalKey?: string;

  @Column(() => null)
  @AllowNull
  @Column(DataType.INTEGER)
  Status?: number;

  @Column(() => null)
  @AllowNull
  @Column(DataType.JSONB)
  urlMessage?: object;

  @Column(() => null)
  @AllowNull
  @Column(DataType.JSONB)
  apiConfig?: object;

  @CreatedAt
  @Column(DataType.DATE(6))
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE(6))
  updatedAt!: Date;

  @ForeignKey(() => TenantZPRO)
  @Column
  tenantId!: number;

  @BelongsTo(() => TenantZPRO)
  tenant!: TenantZPRO;

  @AfterCreate
  @AfterUpdate
  static hookMessage(instance: ApiMessage): void {
    if (instance?.apiConfig?.hookMessagesAPI) {
      const payload = {
        messageId: instance.messageId,
        messageWA: instance.messageWA,
        timestamp: instance.timestamp,
        body: instance.body,
        externalKey: instance.externalKey,
        Status: 'HookMessage-WebHooksAPI',
        authToken: instance.authToken
      };

      QueueZPRODig.default.add(
        instance.sessionId + '-WebHooksAPI',
        {
          url: instance.apiConfig.hookMessagesAPI,
          type: payload.Status,
          payload
        }
      );
    }
  }
} 