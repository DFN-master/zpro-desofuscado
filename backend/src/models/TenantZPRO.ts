import { Model, Column, Table, PrimaryKey, AutoIncrement, BelongsTo, ForeignKey, DataType, Default } from 'sequelize-typescript';
import UserZPRO from './UserZPRO';

@Table
export default class Tenant extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column({
    defaultValue: 'active'
  })
  status: string;

  @Column
  name: string;

  @ForeignKey(() => UserZPRO)
  @Column
  ownerId: number;

  @BelongsTo(() => UserZPRO)
  owner: UserZPRO;

  @Column(DataType.JSONB)
  businessHours: any[];

  @Column(DataType.JSONB) 
  metaToken: any[];

  @Column(DataType.JSONB)
  updateNames: any[];

  @Column
  messageBusToken: string;

  @Column
  maxUsers: number;

  @Column
  maxConnections: number;

  @Column
  maxRetries: number;

  @Column
  identity: string;

  @Column({
    defaultValue: 'disabled'
  })
  asaas: string;

  @Column
  asaasToken: string;

  @Column
  tenantLicenseId: string;

  @Column
  wuzapiHost: string;

  @Column
  bmToken: string;

  @Column
  hubToken: string;

  @Column
  smsToken: string;

  @Column
  metaToken: string;

  @Column
  webhookChecked: string;

  @Column
  tenantEmail: string;

  @Column
  asaasCustomerId: string;

  @Column
  serviceTransfer: string;

  @Column
  ticketLimit: number;

  @Default(false)
  @Column
  acceptTerms: boolean;

  @Column({
    defaultValue: 'disabled'
  })
  noRedis: string;

  @Column({
    defaultValue: 3
  })
  trialPeriod: number;

  @Column({
    defaultValue: 'disabled'
  })
  nullTickets: string;

  @Column({
    defaultValue: 'disabled'
  })
  showChatBot: string;

  @Column({
    defaultValue: 'disabled'
  })
  maxConnections: string;

  @Column({
    defaultValue: 'disabled'
  })
  forceAdmin: string;

  @Column({
    defaultValue: 'disabled'
  })
  fixConnections: string;

  @Column({
    defaultValue: 'disabled'
  })
  groupTickets: string;

  @Column({
    defaultValue: 'disabled'
  })
  systemColors: string;

  @Column
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @CreatedAt
  trial: Date;
} 