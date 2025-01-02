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
export default class TicketEvaluation extends Model {
  @Column
  @PrimaryKey
  @AutoIncrement
  id!: number;

  @Column
  ticketId!: string;

  @Column
  evaluation!: number;

  @Column
  attempts!: number;

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