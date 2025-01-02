import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  DataType,
  CreatedAt,
  UpdatedAt
} from 'sequelize-typescript';
import Contact from './ContactZPRO';
import Ticket from './TicketZPRO';

interface AutoReplyLogsAttributes {
  id: string;
  autoReplyId: string;
  autoReplyName: string;
  stepsReplyId: string;
  stepsReplyName: string;
  wordsReply: string;
  ticketId: number;
  contactId: number;
  createdAt: Date;
  updatedAt: Date;
}

@Table({
  freezeTableName: true
})
class AutoReplyLogs extends Model<AutoReplyLogsAttributes> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: string;

  @Column
  autoReplyId!: string;

  @Column(DataType.TEXT)
  autoReplyName!: string;

  @Column
  stepsReplyId!: string;

  @Column(DataType.TEXT)
  stepsReplyName!: string;

  @Column(DataType.TEXT)
  wordsReply!: string;

  @ForeignKey(() => Ticket)
  @Column
  ticketId!: number;

  @BelongsTo(() => Ticket)
  ticket!: Ticket;

  @ForeignKey(() => Contact)
  @Column
  contactId!: number;

  @BelongsTo(() => Contact, 'contactId')
  contact!: Contact;

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date;
}

export default AutoReplyLogs; 