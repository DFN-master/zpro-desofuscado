import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  CreatedAt,
  UpdatedAt,
  BelongsTo,
  ForeignKey
} from "sequelize-typescript";
import Tenant from "./TenantZPRO";

@Table
export default class Setting extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number;

  @Column
  key!: string;

  @Column
  value!: string;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  @ForeignKey(() => Tenant)
  @Column
  tenantId!: number;

  @BelongsTo(() => Tenant)
  tenant!: Tenant;
} 