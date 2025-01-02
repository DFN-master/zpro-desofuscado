import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  DataType
} from "sequelize-typescript";

import Contact from "./ContactZPRO";
import Message from "./MessageZPRO";
import Ticket from "./TicketZPRO";
import User from "./UserZPRO";

interface MessageOffLineAttributes {
  id: number;
  ticketId: number;
  contactId: number;
  userId: number;
  body: string;
  mediaType?: string;
  mediaUrl?: string;
  mediaName?: string;
  quotedMsgId?: string;
  ack?: number;
  read: boolean;
  fromMe: boolean;
  isDeleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Table({ freezeTableName: true })
class MessagesOffLine extends Model<MessageOffLineAttributes> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number;

  @Column(255)
  @Column
  ack!: number;

  @Column({ defaultValue: false })
  @Column
  read!: boolean;

  @Column({ defaultValue: false })
  @Column
  fromMe!: boolean;

  @Column(DataType.TEXT)
  body!: string;

  @Column(DataType.VIRTUAL)
  mediaName!: string;

  @Column(DataType.VIRTUAL)
  mediaUrl!: string;

  @Column
  mediaType?: string;

  @Column({ defaultValue: false })
  @Column
  isDeleted!: boolean;

  @CreatedAt
  @Column(DataType.DATE(1))
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE(1))
  updatedAt!: Date;

  @ForeignKey(() => Message)
  @Column
  quotedMsgId?: string;

  @BelongsTo(() => Message, "quotedMsgId")
  quotedMsg?: Message;

  @ForeignKey(() => Ticket)
  @Column
  ticketId!: number;

  @BelongsTo(() => Ticket)
  ticket?: Ticket;

  @ForeignKey(() => Contact)
  @Column
  contactId!: number;

  @BelongsTo(() => Contact, "contactId")
  contact?: Contact;

  @ForeignKey(() => User)
  @Column
  userId!: number;

  @BelongsTo(() => User)
  user?: User;

  get getMediaName(): string | null {
    return this.getDataValue("mediaName");
  }

  get getMediaUrl(): string | null {
    if (this.getDataValue("mediaName")) {
      const { BACKEND_URL, PROXY_PORT } = process.env;
      const mediaName = this.getDataValue("mediaName");
      const tenantId = this.ticket ? this.ticket.tenantId : null;
      return `${BACKEND_URL}:${PROXY_PORT}/public/${tenantId}/${mediaName}`;
    }
    return null;
  }
}

export default MessagesOffLine; 