import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  AllowNull,
  Default,
  CreatedAt,
  UpdatedAt,
  DataType
} from 'sequelize-typescript';
import Tenant from './TenantZPRO';
import User from './UserZPRO';

@Table
export default class TicketNotes extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number;

  @Column(DataType.TEXT)
  notes!: string;

  @Column
  ticketId!: number;

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

  @Default(null)
  @AllowNull
  @Column
  idFront!: string;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
} 