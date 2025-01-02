import { Model, DataType, Table, Column, ForeignKey, BelongsTo, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';
import Tenant from './TenantZPRO';
import User from './UserZPRO';

@Table
export default class BanList extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: string;

  @Column(DataType.TEXT)
  groupId!: string;

  @Column(DataType.TEXT)
  ottho!: object;

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