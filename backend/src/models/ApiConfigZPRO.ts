import {
  Table,
  Column,
  Model,
  PrimaryKey,
  Default,
  BelongsTo,
  ForeignKey,
  DataType,
  CreatedAt,
  UpdatedAt
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import User from './UserZPRO';
import Tenant from './TenantZPRO';
import Whatsapp from './WhatsappZPRO';

@Table
export default class ApiConfig extends Model {
  @PrimaryKey
  @Default(uuidv4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => Whatsapp)
  @Column
  sessionId!: number;

  @BelongsTo(() => Whatsapp)
  session!: Whatsapp;

  @Column
  name!: string;

  @Default(true)
  @Column
  isActive!: boolean;

  @Column
  token!: string;

  @Column
  authToken!: string;

  @Column
  urlMessageStatus!: string;

  @Column
  urlServiceStatus!: string;

  @ForeignKey(() => User)
  @Column
  userId!: number;

  @BelongsTo(() => User)
  user!: User;

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date;

  @ForeignKey(() => Tenant)
  @Column
  tenantId!: number;

  @BelongsTo(() => Tenant)
  tenant!: Tenant;
} 