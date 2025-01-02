import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
  DataType
} from 'sequelize-typescript';

import User from './UserZPRO';
import StepsReply from './StepsReplyZPRO';
import Queue from './QueueZPRO';

interface StepsReplyActionsAttributes {
  id: string;
  stepReplyId: number;
  action: string;
  userDestination?: string;
  nextStepId: number;
  userId: number;
  queueId: number;
  userIdDestination: number;
  createdAt: Date;
  updatedAt: Date;
}

@Table({
  freezeTableName: true
})
export default class StepsReplyActions extends Model<StepsReplyActionsAttributes> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: string;

  @Column
  @ForeignKey(() => StepsReply)
  stepReplyId!: number;

  @BelongsTo(() => StepsReply, 'stepReplyId')
  stepsReply!: StepsReply;

  @Column(DataType.STRING)
  action!: string;

  @Column(DataType.STRING)
  userDestination?: string;

  @Column
  nextStepId!: number;

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

  @ForeignKey(() => Queue)
  @Column(DataType.INTEGER)
  queueId!: number;

  @BelongsTo(() => Queue)
  queue!: Queue;

  @ForeignKey(() => User)
  @Column
  userIdDestination!: number;

  @BelongsTo(() => User)
  userDestin!: User;

  @Column
  @ForeignKey(() => StepsReply)
  nextStepId!: number;

  @BelongsTo(() => StepsReply, 'nextStepId')
  nextStep!: StepsReply;
} 