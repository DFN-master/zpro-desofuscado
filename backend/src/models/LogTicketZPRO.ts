import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  DataType,
  AllowNull,
  Default
} from "sequelize-typescript";

import Ticket from "./TicketZPRO";
import User from "./UserZPRO";
import Queue from "./QueueZPRO";
import Tenant from "./TenantZPRO";

@Table
export default class LogTicket extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number;

  @Column(DataType.TEXT)
  type!: string;

  @Default(0)
  @Column(DataType.DATE)
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date;

  @ForeignKey(() => Ticket)
  @Column
  ticketId!: number;

  @BelongsTo(() => Ticket)
  ticket!: Ticket;

  @ForeignKey(() => User)
  @AllowNull(true)
  @Default(null)
  @Column
  userId!: number;

  @BelongsTo(() => User)
  user!: User;

  @ForeignKey(() => Queue)
  @Column
  queueId!: number;

  @BelongsTo(() => Queue)
  queue!: Queue;

  @ForeignKey(() => Tenant)
  @Column
  tenantId!: number;

  @BelongsTo(() => Tenant)
  tenant!: Tenant;
} 