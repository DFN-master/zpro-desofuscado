import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  Default,
  CreatedAt,
  UpdatedAt,
  ForeignKey,
  BelongsTo
} from 'sequelize-typescript';
import Tenant from './TenantZPRO';
import User from './UserZPRO';

@Table
export default class Tags extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number;

  @Column
  tag!: string;

  @Column
  color!: string;

  @Default(true)
  @Column
  isActive!: boolean;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

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
} 