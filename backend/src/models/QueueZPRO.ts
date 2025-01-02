import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  Default,
  CreatedAt,
  UpdatedAt
} from "sequelize-typescript";

import Tenant from "./TenantZPRO";
import User from "./UserZPRO";

@Table
export default class Queue extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number;

  @Column
  queue!: string;

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