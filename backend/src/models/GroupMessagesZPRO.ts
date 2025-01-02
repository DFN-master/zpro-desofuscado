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
  Default
} from 'sequelize-typescript';
import Tenant from './TenantZPRO';
import User from './UserZPRO';

@Table
export default class GroupMessages extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number;

  @Default(true)
  @Column
  isActive!: boolean;

  @Column
  group!: string;

  @ForeignKey(() => Tenant)
  @Column
  tenantId!: number;

  @BelongsTo(() => Tenant)
  tenant!: Tenant;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  @ForeignKey(() => User)
  @Column
  userId!: number;

  @BelongsTo(() => User)
  user!: User;
} 