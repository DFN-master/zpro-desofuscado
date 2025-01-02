import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  CreatedAt,
  UpdatedAt,
  ForeignKey,
  BelongsTo,
  HasMany,
  DataType
} from "sequelize-typescript";

import User from "./UserZPRO";
import StepsReply from "./StepsReplyZPRO";
import Tenant from "./TenantZPRO";

interface AutoReplyAttributes {
  id: string;
  name: string;
  celularTeste?: string;
  isActive: boolean;
  action: number;
  userId: number;
  tenantId: number;
  createdAt: Date;
  updatedAt: Date;
}

@Table({
  freezeTableName: true
})
class AutoReply extends Model<AutoReplyAttributes> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: string;

  @Column(DataType.TEXT)
  name!: string;

  @Column(DataType.TEXT)
  celularTeste?: string;

  @Column({
    defaultValue: true
  })
  isActive!: boolean;

  @Column({
    defaultValue: 0
  })
  action!: number;

  @ForeignKey(() => User)
  @Column
  userId!: number;

  @BelongsTo(() => User)
  user!: User;

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date;

  @HasMany(() => StepsReply)
  stepsReply!: StepsReply[];

  @ForeignKey(() => Tenant)
  @Column
  tenantId!: number;

  @BelongsTo(() => Tenant)
  tenant!: Tenant;
}

export default AutoReply; 