import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
  DataType
} from 'sequelize-typescript';

import Tenant from './TenantZPRO';
import User from './UserZPRO';

@Table
export default class FarewellPrivateMessage extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: string;

  @Column(DataType.TEXT)
  message!: string;

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