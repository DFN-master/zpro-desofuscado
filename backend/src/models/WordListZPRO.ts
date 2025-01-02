import {
  Table,
  Model,
  Column,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt
} from "sequelize-typescript";

import Tenant from "./TenantZPRO";
import User from "./UserZPRO";

@Table
export default class WordList extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: string;

  @Column(DataType.TEXT)
  word!: string;

  @Column(DataType.TEXT)
  groupId!: object;

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