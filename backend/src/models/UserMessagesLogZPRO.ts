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
  UpdatedAt,
  AllowNull
} from "sequelize-typescript";

import MessageZPRO from "./MessageZPRO";
import TicketZPRO from "./TicketZPRO";
import UserZPRO from "./UserZPRO";

interface UserMessagesLogAttributes {
  id: number;
  userId: number;
  messageId: string;
  ticketId: number;
  createdAt: Date;
  updatedAt: Date;
}

@Table({
  freezeTableName: true
})
class UserMessagesLog extends Model<UserMessagesLogAttributes> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number;

  @ForeignKey(() => UserZPRO)
  @Column
  userId!: number;

  @BelongsTo(() => UserZPRO)
  user!: UserZPRO;

  @ForeignKey(() => MessageZPRO)
  @Default(null)
  @AllowNull
  @Column
  messageId!: string;

  @BelongsTo(() => MessageZPRO, "messageId")
  message!: MessageZPRO;

  @ForeignKey(() => TicketZPRO)
  @Default(null)
  @AllowNull
  @Column
  ticketId!: number;

  @BelongsTo(() => TicketZPRO)
  ticket!: TicketZPRO;

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date;
}

export default UserMessagesLog; 