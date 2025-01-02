import {
  Table,
  Column,
  Model,
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
export default class TicketProtocol extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number;

  @Column
  protocol!: string;

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

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
} 