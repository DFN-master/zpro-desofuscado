import {
  Table,
  Model,
  Column,
  PrimaryKey,
  AutoIncrement,
  CreatedAt,
  UpdatedAt,
  BelongsTo,
  ForeignKey
} from "sequelize-typescript";

import PrivateMessageZPRO from "./PrivateMessageZPRO";
import UsersPrivateGroupsZPRO from "./UsersPrivateGroupsZPRO";

@Table({
  freezeTableName: true
})
export default class ReadPrivateMessageGroups extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  @BelongsTo(() => PrivateMessageZPRO)
  internalMessage!: PrivateMessageZPRO;

  @ForeignKey(() => UsersPrivateGroupsZPRO)
  @Column
  userGroupId!: number;

  @ForeignKey(() => PrivateMessageZPRO)
  @Column
  internalMessageId!: number;

  @BelongsTo(() => UsersPrivateGroupsZPRO)
  userGroup!: UsersPrivateGroupsZPRO;
} 