import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  CreatedAt,
  UpdatedAt,
  ForeignKey,
  BelongsTo
} from 'sequelize-typescript';

import Tenant from './TenantZPRO';
import User from './UserZPRO';

@Table
export default class Plan extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  value: number;

  @Column
  users: number;

  @Column
  connection: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @ForeignKey(() => Tenant)
  @Column
  tenantId: number;

  @BelongsTo(() => Tenant)
  tenant: Tenant;
} 