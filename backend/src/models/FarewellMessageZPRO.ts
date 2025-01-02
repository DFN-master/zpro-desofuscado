import { 
  Table, 
  Column, 
  Model, 
  PrimaryKey, 
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  DataType,
  CreatedAt,
  UpdatedAt
} from 'sequelize-typescript';

import Tenant from './TenantZPRO';
import User from './UserZPRO';

@Table
export default class FarewellMessage extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: string;

  @Column(DataType.TEXT)
  message!: string;

  @Column(DataType.TEXT)
  groupId!: object;

  @ForeignKey(() => User)
  @Column
  userId!: number;

  @BelongsTo(() => User)
  user!: User;

  @ForeignKey(() => Tenant)
  @Column
  tenantId!: number;

  @BelongsTo(() => Tenant)
  tenant!: Tenant;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
} 