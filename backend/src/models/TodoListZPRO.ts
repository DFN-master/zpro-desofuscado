import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Default,
  CreatedAt,
  UpdatedAt,
  ForeignKey,
  BelongsTo,
  DataType
} from "sequelize-typescript";

import Tenant from "./TenantZPRO";
import User from "./UserZPRO";

@Table
export default class TodoList extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Default(null)
  @AllowNull
  @Column(DataType.TEXT)
  name: string;

  @Default(null)
  @AllowNull
  @Column(DataType.TEXT)
  description: string;

  @Default(null)
  @AllowNull
  @Column(DataType.DATE)
  limitDate: Date;

  @Default(null)
  @AllowNull
  @Column
  comments: string;

  @Default(null)
  @AllowNull
  @Column(DataType.ENUM("pending", "finished", "delayed"))
  status: "pending" | "finished" | "delayed";

  @Default(null)
  @AllowNull
  @Column(DataType.ENUM("high", "medium", "low", "none"))
  priority: "high" | "medium" | "low" | "none";

  @Default(null)
  @AllowNull
  @Column(DataType.TEXT)
  owner: string;

  @ForeignKey(() => Tenant)
  @Column
  tenantId: number;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
} 