import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  HasMany,
  DataType,
  Default,
  CreatedAt,
  UpdatedAt
} from 'sequelize-typescript';

import User from './UserZPRO';
import AutoReply from './AutoReplyZPRO';
import StepsReplyAction from './StepsReplyActionZPRO';

@Table({
  freezeTableName: true
})
export default class StepsReply extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: string;

  @Column(DataType.TEXT)
  reply!: string;

  @Default(false)
  @Column(DataType.BOOLEAN)
  initialStep!: boolean;

  @Column
  @ForeignKey(() => AutoReply)
  idAutoReply!: number;

  @BelongsTo(() => AutoReply, 'idAutoReply')
  autoReply!: AutoReply;

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

  @HasMany(() => StepsReplyAction)
  stepsReplyAction!: StepsReplyAction[];
} 