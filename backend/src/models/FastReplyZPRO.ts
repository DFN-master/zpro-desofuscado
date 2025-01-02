import {
  Table,
  Model,
  PrimaryKey,
  AutoIncrement,
  Column,
  CreatedAt,
  UpdatedAt,
  ForeignKey,
  BelongsTo,
  DataType
} from 'sequelize-typescript';

import Tenant from './TenantZPRO';
import User from './UserZPRO';

interface FastReplyAttributes {
  id: number;
  key: string;
  message: string;
  media?: string;
  voice?: string;
  userId: number;
  tenantId: number;
  createdAt: Date;
  updatedAt: Date;
}

@Table({
  freezeTableName: true
})
export default class FastReply extends Model<FastReplyAttributes> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number;

  @Column({
    allowNull: false,
    type: DataType.STRING
  })
  key!: string;

  @Column({
    allowNull: false,
    type: DataType.STRING
  })
  message!: string;

  @Column({
    defaultValue: null,
    allowNull: true,
    type: DataType.STRING
  })
  media?: string;

  @Column({
    defaultValue: null,
    allowNull: true,
    type: DataType.STRING
  })
  voice?: string;

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