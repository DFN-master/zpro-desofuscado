import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt
} from 'sequelize-typescript';

import Tenant from './TenantZPRO';
import User from './UserZPRO';

@Table
export default class Notification extends Model {
  @AutoIncrement
  @PrimaryKey
  @Column
  id!: number;

  @Column
  message!: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false
  })
  isRead!: boolean;

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