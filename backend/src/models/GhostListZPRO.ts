import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  BelongsTo,
  ForeignKey,
  DataType,
  CreatedAt,
  UpdatedAt
} from 'sequelize-typescript';
import Tenant from './TenantZPRO';
import User from './UserZPRO';

@Table
export default class GhostList extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number;

  @Column(DataType.TEXT)
  shortcut!: string;

  @Column(DataType.TEXT)
  message!: object;

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