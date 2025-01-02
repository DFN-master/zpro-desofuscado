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
} from "sequelize-typescript";

import UserZPRO from "./UserZPRO";
import QueueZPRO from "./QueueZPRO";

@Table({
  freezeTableName: true
})
export default class UsersQueues extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number;

  @ForeignKey(() => QueueZPRO)
  @Column
  queueId!: number;

  @BelongsTo(() => QueueZPRO)
  queue!: QueueZPRO;

  @ForeignKey(() => UserZPRO)
  @Column
  userId!: number;

  @BelongsTo(() => UserZPRO)
  user!: UserZPRO;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
} 